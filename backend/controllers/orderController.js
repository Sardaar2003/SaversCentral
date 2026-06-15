import Order from '../models/Order.js';
import Project from '../models/Project.js';
import Product from '../models/Product.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { getService } from '../services/serviceRegistry.js';

// Helper to escape CSV values
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Helper to extract decline message from an order's apiResponse
const getDeclineMessage = (order) => {
  const res = order.apiResponse;
  if (!res) return '';
  if (res.message) return res.message;
  const data = res.data || res;
  if (!data) return '';
  if (data.message) return data.message;
  if (data.error) return data.error;
  const tx = data.data?.transaction || data.transaction;
  if (tx) {
    if (tx.response_text) return tx.response_text;
    if (tx.gateway_response) return tx.gateway_response;
    if (tx.response_msg) return tx.response_msg;
  }
  return '';
};

// Helper to compile filters based on user role and query params
const compileOrderFilters = async (user, query) => {
  console.log(`[DEBUG][ORDER-FILTER] Compiling filters for user: "${user.username}" (role: ${user.role}, ID: ${user._id})`);
  const filter = {};

  // 1. RBAC visibility boundaries
  if (user.role === 'user') {
    filter.submittedBy = user._id;
    console.log(`[DEBUG][ORDER-FILTER] Role "user" — scoped to own orders only`);
  } else if (user.role === 'manager') {
    // Find manager's team
    const team = await Team.findOne({ manager: user._id });
    if (team) {
      filter.submittedBy = { $in: [...team.members, user._id] };
      console.log(`[DEBUG][ORDER-FILTER] Role "manager" — team "${team.name}" found. Visible members: ${team.members.length + 1}`);
    } else {
      filter.submittedBy = user._id;
      console.log(`[DEBUG][ORDER-FILTER] Role "manager" — no team found, scoped to own orders only`);
    }
  } else {
    console.log(`[DEBUG][ORDER-FILTER] Role "admin" — full visibility (no submittedBy filter)`);
  }

  // 2. Hierarchical Query Filters
  if (query.projectId) {
    filter.projectId = query.projectId;
    console.log(`[DEBUG][ORDER-FILTER] Filtering by projectId: ${query.projectId}`);
  }
  if (query.productId) {
    filter.productId = query.productId;
    console.log(`[DEBUG][ORDER-FILTER] Filtering by productId: ${query.productId}`);
  }

  // Date range filters
  if (query.startDate || query.endDate) {
    filter.dateCreated = {};
    if (query.startDate) {
      filter.dateCreated.$gte = new Date(query.startDate);
      console.log(`[DEBUG][ORDER-FILTER] Date range start: ${query.startDate}`);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.dateCreated.$lte = end;
      console.log(`[DEBUG][ORDER-FILTER] Date range end: ${query.endDate} (adjusted to EOD)`);
    }
  }

  // Phone search
  if (query.phone) {
    filter.customerPhone = { $regex: query.phone.trim(), $options: 'i' };
    console.log(`[DEBUG][ORDER-FILTER] Phone search: "${query.phone.trim()}"`);
  }

  console.log(`[DEBUG][ORDER-FILTER] Final compiled filter:`, JSON.stringify(filter, null, 2));
  return filter;
};

// @desc    Submit an order for a specific product campaign
// @route   POST /api/orders
// @access  Private
export const submitOrder = async (req, res) => {
  const { productId, email, phone, bill_fname, bill_lname } = req.body;
  console.log(`[DEBUG][ORDER] ──── ORDER SUBMISSION START ────`);
  console.log(`[DEBUG][ORDER] Submitted by: "${req.user.username}" (ID: ${req.user._id}, role: ${req.user.role})`);
  console.log(`[DEBUG][ORDER] Input → productId: "${productId}", email: "${email}", phone: "${phone}", name: "${bill_fname} ${bill_lname}"`);

  if (!productId || !email || !phone || !bill_fname || !bill_lname) {
    console.log(`[DEBUG][ORDER] REJECTED — missing required fields`);
    return res.status(400).json({ success: false, message: 'Missing required fields (Product, Email, Phone, Name)' });
  }

  // Block generic emails
  const emailLower = email.toLowerCase().trim();
  const blockedEmails = ['noemail@noemail.com', 'test@test.com', 'admin@admin.com', 'user@user.com', 'no-email@noemail.com'];
  if (blockedEmails.includes(emailLower) || emailLower.startsWith('noemail@')) {
    console.log(`[DEBUG][ORDER] REJECTED — blocked generic email: "${emailLower}"`);
    return res.status(400).json({
      success: false,
      message: 'Generic email addresses are not accepted. Try firstnamelastname@noemail.com or phonenumber@noemail.com.'
    });
  }

  try {
    // Check if product exists and is enabled
    const product = await Product.findById(productId).populate('project');
    if (!product) {
      console.log(`[DEBUG][ORDER] REJECTED — product not found. productId: "${productId}"`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    console.log(`[DEBUG][ORDER] Product found: "${product.name}" (key: ${product.key}, enabled: ${product.enabled})`);
    console.log(`[DEBUG][ORDER] Product config → campaignId: ${product.campaignId}, offerId: ${product.offerId}, connectionId: ${product.connectionId}, serviceName: "${product.serviceName}"`);

    if (!product.enabled) {
      console.log(`[DEBUG][ORDER] REJECTED — product is disabled`);
      return res.status(400).json({ success: false, message: 'Selected product campaign is currently disabled' });
    }

    // Check if parent project is enabled
    const project = product.project;
    console.log(`[DEBUG][ORDER] Parent project: "${project?.name}" (enabled: ${project?.enabled})`);
    if (!project || !project.enabled) {
      console.log(`[DEBUG][ORDER] REJECTED — parent project is disabled or not found`);
      return res.status(400).json({ success: false, message: 'Parent project campaign is currently disabled' });
    }

    // Resolve service adapter from registry
    const service = getService(product.serviceName);
    console.log(`[DEBUG][ORDER] Service adapter resolved: "${product.serviceName}"`);

    // Merge product parameters into Sublytics API payload
    const submissionPayload = {
      ...req.body,
      connectionId: product.connectionId,
      campaignId: product.campaignId,
      offerId: product.offerId,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Mozilla/5.0'
    };
    console.log(`[DEBUG][ORDER] Final submission payload (before API call):`, JSON.stringify({
      ...submissionPayload,
      card_number: submissionPayload.card_number ? `****${submissionPayload.card_number.slice(-4)}` : 'N/A',
      card_cvv: '***'
    }, null, 2));

    // Duplicate transaction & violation checking rules
    const cleanCard = submissionPayload.card_number ? String(submissionPayload.card_number).trim() : '';
    const cleanPhone = phone.trim();

    // Query previous transactions for this record
    const previousOrders = await Order.find({
      $or: [
        { customerEmail: emailLower },
        { customerPhone: cleanPhone },
        ...(cleanCard ? [{ 'apiPayload.card_number': cleanCard }] : [])
      ]
    }).sort({ dateCreated: 1 });

    let hasViolation = false;
    let violationReason = '';

    if (previousOrders.length > 0) {
      const sameProductOrders = previousOrders.filter(
        o => o.productId.toString() === productId.toString()
      );

      // Rule 1: A person can use the same data for another product only if the data submitted before has passed successfully.
      const hasApprovedOrder = previousOrders.some(o => o.status === 'Approved');
      
      if (sameProductOrders.length === 0 && !hasApprovedOrder) {
        hasViolation = true;
        violationReason = 'Violation: Cannot submit for another product because previous transactions have not passed successfully.';
      }

      // Rule 2: No person should do two transactions of a given record except the case provided before.
      if (!hasViolation && sameProductOrders.length > 0) {
        const hasApprovedSameProduct = sameProductOrders.some(o => o.status === 'Approved');
        if (hasApprovedSameProduct) {
          hasViolation = true;
          violationReason = 'Violation: Record already has an approved transaction for this product.';
        } else if (sameProductOrders.length === 1) {
          const prevOrder = sameProductOrders[0];
          const prevDeclineMsg = getDeclineMessage(prevOrder);
          const prevDeclineLower = prevDeclineMsg.toLowerCase();
          const isEligibleForRetry = prevDeclineLower.includes('do not honor') || prevDeclineLower.includes('pick up card');
          
          if (!isEligibleForRetry) {
            hasViolation = true;
            violationReason = `Violation: Cannot retry transaction for this product (original failure reason did not allow retry: "${prevDeclineMsg || 'Failed'}").`;
          }
        } else {
          hasViolation = true;
          violationReason = 'Violation: Maximum transaction attempts (2) reached for this product.';
        }
      }
    }

    if (hasViolation) {
      console.log(`[DEBUG][ORDER] REJECTED — Violation detected: "${violationReason}"`);
      
      const order = await Order.create({
        orderId: `VIOLATION-${Date.now()}`,
        submittedBy: req.user._id,
        projectId: project._id,
        projectName: project.name,
        productId: product._id,
        productName: product.name,
        campaignId: product.campaignId,
        offerId: product.offerId,
        connectionId: product.connectionId,
        customerName: `${bill_fname} ${bill_lname}`,
        customerEmail: emailLower,
        customerPhone: phone,
        amount: 0,
        status: 'Violated',
        apiResponse: { message: violationReason },
        apiPayload: submissionPayload
      });

      console.log(`[DEBUG][ORDER] Violation order saved to DB. MongoDB ID: ${order._id}`);
      console.log(`[DEBUG][ORDER] ──── ORDER VIOLATED ✗ ────`);

      return res.status(400).json({
        success: false,
        message: violationReason,
        data: {
          orderId: order.orderId,
          projectName: order.projectName,
          productName: order.productName,
          status: order.status,
          apiResponse: order.apiResponse
        }
      });
    }

    // Call Sublytics API
    console.log(`[DEBUG][ORDER] Calling ${product.serviceName} API...`);
    const serviceResult = await service.submitOrder(submissionPayload);
    console.log(`[DEBUG][ORDER] API call completed. Success: ${serviceResult.success}`);

    // Parse Sublytics response to extract Order ID
    let orderId = '';
    const resData = serviceResult.data?.data;
    if (resData?.transaction?.order?.id) {
      orderId = String(resData.transaction.order.id);
      console.log(`[DEBUG][ORDER] Extracted orderId from transaction.order.id: "${orderId}"`);
    } else if (resData?.order?.id) {
      orderId = String(resData.order.id);
      console.log(`[DEBUG][ORDER] Extracted orderId from order.id: "${orderId}"`);
    } else if (resData?.order_id) {
      orderId = String(resData.order_id);
      console.log(`[DEBUG][ORDER] Extracted orderId from order_id: "${orderId}"`);
    } else {
      orderId = `MOCK-ORD-${Date.now()}`;
      console.log(`[DEBUG][ORDER] No orderId in response, generated mock: "${orderId}"`);
    }

    // Extract amount
    const amount = Number(resData?.transaction?.transaction_total) || 
                   parseFloat(product.trialPrice?.replace('$', '') || '0') || 
                   2.93;
    console.log(`[DEBUG][ORDER] Calculated amount: $${amount}`);

    // Save order details to MongoDB
    const order = await Order.create({
      orderId,
      submittedBy: req.user._id,
      projectId: project._id,
      projectName: project.name,
      productId: product._id,
      productName: product.name,
      campaignId: product.campaignId,
      offerId: product.offerId,
      connectionId: product.connectionId,
      customerName: `${bill_fname} ${bill_lname}`,
      customerEmail: emailLower,
      customerPhone: phone,
      amount,
      status: serviceResult.success ? 'Approved' : 'Failed',
      apiResponse: serviceResult.data,
      apiPayload: serviceResult.payload
    });
    console.log(`[DEBUG][ORDER] Order saved to DB. MongoDB ID: ${order._id}, orderId: "${order.orderId}", status: "${order.status}"`);

    if (serviceResult.success) {
      console.log(`[DEBUG][ORDER] ──── ORDER APPROVED ✓ ────`);
      return res.status(201).json({
        success: true,
        message: 'Order processed successfully',
        data: {
          id: order._id,
          orderId: order.orderId,
          projectName: order.projectName,
          productName: order.productName,
          status: order.status,
          apiResponse: order.apiResponse
        }
      });
    } else {
      console.log(`[DEBUG][ORDER] ──── ORDER FAILED ✗ ────`);
      console.log(`[DEBUG][ORDER] Decline reason: ${serviceResult.message || 'Unknown'}`);
      return res.status(400).json({
        success: false,
        message: serviceResult.message || 'Order was declined.',
        data: {
          orderId: orderId.startsWith('MOCK') ? undefined : orderId,
          projectName: order.projectName,
          productName: order.productName,
          status: order.status,
          apiResponse: order.apiResponse
        }
      });
    }
  } catch (error) {
    console.error(`[DEBUG][ORDER] ──── ORDER ERROR ────`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order history with filters and pagination
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  console.log(`[DEBUG][ORDER] Fetching orders — page: ${page}, limit: ${limit}, skip: ${skip}`);

  try {
    const filter = await compileOrderFilters(req.user, req.query);

    const total = await Order.countDocuments(filter);
    console.log(`[DEBUG][ORDER] Total matching orders: ${total}`);

    const orders = await Order.find(filter)
      .populate('submittedBy', 'name username')
      .sort({ dateCreated: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`[DEBUG][ORDER] Returning ${orders.length} orders (page ${page} of ${Math.ceil(total / limit)})`);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error(`[DEBUG][ORDER] Get orders ERROR:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export order history as CSV
// @route   GET /api/orders/export
// @access  Private (Admin & Manager only)
export const exportOrdersCsv = async (req, res) => {
  console.log(`[DEBUG][ORDER] CSV export requested by "${req.user.username}" (role: ${req.user.role})`);
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      console.log(`[DEBUG][ORDER] CSV export REJECTED — role "${req.user.role}" not authorized`);
      return res.status(403).json({ success: false, message: 'Not authorized to export CSV data' });
    }

    const filter = await compileOrderFilters(req.user, req.query);

    const orders = await Order.find(filter)
      .populate('submittedBy', 'name username')
      .sort({ dateCreated: -1 });

    console.log(`[DEBUG][ORDER] CSV export — ${orders.length} orders matched filters`);

    const headers = [
      'Order ID',
      'Project Name',
      'Product Name',
      'Campaign ID',
      'Offer ID',
      'Connection ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Amount ($)',
      'Status',
      'Submitted By',
      'Date Submitted'
    ];

    let csvContent = headers.join(',') + '\r\n';

    orders.forEach(order => {
      const row = [
        escapeCSV(order.orderId),
        escapeCSV(order.projectName),
        escapeCSV(order.productName),
        escapeCSV(order.campaignId),
        escapeCSV(order.offerId),
        escapeCSV(order.connectionId),
        escapeCSV(order.customerName),
        escapeCSV(order.customerEmail),
        escapeCSV(order.customerPhone),
        escapeCSV(order.amount),
        escapeCSV(order.status),
        escapeCSV(order.submittedBy ? order.submittedBy.name : 'Unknown'),
        escapeCSV(new Date(order.dateCreated).toISOString())
      ];
      csvContent += row.join(',') + '\r\n';
    });

    console.log(`[DEBUG][ORDER] CSV generated — ${csvContent.length} bytes, sending download`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=order_history.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error(`[DEBUG][ORDER] Export CSV ERROR:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order statistics based on user role
// @route   GET /api/orders/stats
// @access  Private
export const getOrderStats = async (req, res) => {
  console.log(`[DEBUG][ORDER] Stats requested by "${req.user.username}" (role: ${req.user.role})`);
  try {
    const filter = await compileOrderFilters(req.user, {});

    // Count overall orders
    const totalCount = await Order.countDocuments(filter);
    
    // Count approved orders
    const approvedCount = await Order.countDocuments({ ...filter, status: 'Approved' });
    
    // Count failed orders
    const failedCount = await Order.countDocuments({ ...filter, status: 'Failed' });

    // Calculate total revenue / sales amount (sum of amount for Approved orders)
    const salesAggregate = await Order.aggregate([
      { $match: { ...filter, status: 'Approved' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    
    const totalRevenue = salesAggregate[0]?.totalAmount || 0;
    
    // Calculate approval rate
    const approvalRate = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : '0.0';

    console.log(`[DEBUG][ORDER] Stats result → total: ${totalCount}, approved: ${approvedCount}, failed: ${failedCount}, revenue: $${totalRevenue.toFixed(2)}, approval rate: ${approvalRate}%`);

    return res.json({
      success: true,
      data: {
        totalOrders: totalCount,
        approvedOrders: approvedCount,
        failedOrders: failedCount,
        totalSales: totalRevenue,
        approvalRate: parseFloat(approvalRate)
      }
    });
  } catch (error) {
    console.error(`[DEBUG][ORDER] Get order stats ERROR:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tracking statistics (agent-wise and group-wise) for admin
// @route   GET /api/orders/tracking-stats
// @access  Private (Admin only)
export const getTrackingStats = async (req, res) => {
  console.log(`[DEBUG][ORDER] Tracking stats requested by "${req.user.username}" (role: ${req.user.role})`);
  try {
    const filter = await compileOrderFilters(req.user, req.query);

    // Aggregate orders by agent (submittedBy) with filters applied
    const orderStatsByAgent = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$submittedBy',
          totalRequests: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
          violations: { $sum: { $cond: [{ $eq: ['$status', 'Violated'] }, 1, 0] } }
        }
      }
    ]);

    // Convert to a map for easy lookup
    const agentStatsMap = {};
    orderStatsByAgent.forEach(stat => {
      if (stat._id) {
        agentStatsMap[stat._id.toString()] = {
          totalRequests: stat.totalRequests,
          successful: stat.successful,
          failed: stat.failed,
          violations: stat.violations
        };
      }
    });

    // Fetch all users and teams
    const allUsers = await User.find({}).populate('team');
    const allTeams = await Team.find({}).populate('manager', 'name username');

    // Build agentStats for all users who are agents (role: 'user') or have processed any orders
    const agentStats = allUsers.map(u => {
      const stats = agentStatsMap[u._id.toString()] || { totalRequests: 0, successful: 0, failed: 0, violations: 0 };
      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        role: u.role,
        teamName: u.team?.name || 'No Team',
        ...stats
      };
    });

    // Build groupStats (team-wise)
    const groupStatsMap = {};
    allTeams.forEach(team => {
      groupStatsMap[team._id.toString()] = {
        _id: team._id,
        name: team.name,
        managerName: team.manager?.name || 'Unassigned',
        totalRequests: 0,
        successful: 0,
        failed: 0,
        violations: 0
      };
    });

    const noTeamStats = {
      _id: 'no-team',
      name: 'No Team / Independent',
      managerName: 'N/A',
      totalRequests: 0,
      successful: 0,
      failed: 0,
      violations: 0
    };

    // Accumulate agent stats into team stats
    agentStats.forEach(agent => {
      const userObj = allUsers.find(u => u._id.toString() === agent._id.toString());
      if (userObj && userObj.team) {
        const teamIdStr = userObj.team._id.toString();
        if (groupStatsMap[teamIdStr]) {
          groupStatsMap[teamIdStr].totalRequests += agent.totalRequests;
          groupStatsMap[teamIdStr].successful += agent.successful;
          groupStatsMap[teamIdStr].failed += agent.failed;
          groupStatsMap[teamIdStr].violations += agent.violations;
        }
      } else {
        if (agent.role === 'user' || agent.totalRequests > 0) {
          noTeamStats.totalRequests += agent.totalRequests;
          noTeamStats.successful += agent.successful;
          noTeamStats.failed += agent.failed;
          noTeamStats.violations += agent.violations;
        }
      }
    });

    const groupStats = Object.values(groupStatsMap);
    if (noTeamStats.totalRequests > 0) {
      groupStats.push(noTeamStats);
    }

    console.log(`[DEBUG][ORDER] Tracking stats generated. Agents: ${agentStats.length}, Groups: ${groupStats.length}`);

    return res.json({
      success: true,
      data: {
        agentStats,
        groupStats
      }
    });
  } catch (error) {
    console.error(`[DEBUG][ORDER] Get tracking stats ERROR:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
