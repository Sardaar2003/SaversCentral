import Order from '../models/Order.js';
import Project from '../models/Project.js';
import Product from '../models/Product.js';
import Team from '../models/Team.js';
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

// Helper to compile filters based on user role and query params
const compileOrderFilters = async (user, query) => {
  const filter = {};

  // 1. RBAC visibility boundaries
  if (user.role === 'user') {
    filter.submittedBy = user._id;
  } else if (user.role === 'manager') {
    // Find manager's team
    const team = await Team.findOne({ manager: user._id });
    if (team) {
      filter.submittedBy = { $in: [...team.members, user._id] };
    } else {
      filter.submittedBy = user._id;
    }
  }

  // 2. Hierarchical Query Filters
  if (query.projectId) {
    filter.projectId = query.projectId;
  }
  if (query.productId) {
    filter.productId = query.productId;
  }

  // Date range filters
  if (query.startDate || query.endDate) {
    filter.dateCreated = {};
    if (query.startDate) {
      filter.dateCreated.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.dateCreated.$lte = end;
    }
  }

  // Phone search
  if (query.phone) {
    filter.customerPhone = { $regex: query.phone.trim(), $options: 'i' };
  }

  return filter;
};

// @desc    Submit an order for a specific product campaign
// @route   POST /api/orders
// @access  Private
export const submitOrder = async (req, res) => {
  const { productId, email, phone, bill_fname, bill_lname } = req.body;

  if (!productId || !email || !phone || !bill_fname || !bill_lname) {
    return res.status(400).json({ success: false, message: 'Missing required fields (Product, Email, Phone, Name)' });
  }

  // Block generic emails
  const emailLower = email.toLowerCase().trim();
  const blockedEmails = ['noemail@noemail.com', 'test@test.com', 'admin@admin.com', 'user@user.com', 'no-email@noemail.com'];
  if (blockedEmails.includes(emailLower) || emailLower.startsWith('noemail@')) {
    return res.status(400).json({
      success: false,
      message: 'Generic email addresses are not accepted. Try firstnamelastname@noemail.com or phonenumber@noemail.com.'
    });
  }

  try {
    // Check if product exists and is enabled
    const product = await Product.findById(productId).populate('project');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (!product.enabled) {
      return res.status(400).json({ success: false, message: 'Selected product campaign is currently disabled' });
    }

    // Check if parent project is enabled
    const project = product.project;
    if (!project || !project.enabled) {
      return res.status(400).json({ success: false, message: 'Parent project campaign is currently disabled' });
    }

    // Resolve service adapter from registry
    const service = getService(product.serviceName);

    // Merge product parameters into Sublytics API payload
    const submissionPayload = {
      ...req.body,
      connectionId: product.connectionId,
      campaignId: product.campaignId,
      offerId: product.offerId,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Mozilla/5.0'
    };

    // Call Sublytics API
    const serviceResult = await service.submitOrder(submissionPayload);

    // Parse Sublytics response to extract Order ID
    let orderId = '';
    const resData = serviceResult.data?.data;
    if (resData?.transaction?.order?.id) {
      orderId = String(resData.transaction.order.id);
    } else if (resData?.order?.id) {
      orderId = String(resData.order.id);
    } else if (resData?.order_id) {
      orderId = String(resData.order_id);
    } else {
      orderId = `MOCK-ORD-${Date.now()}`;
    }

    // Extract amount
    const amount = Number(resData?.transaction?.transaction_total) || 
                   parseFloat(product.trialPrice?.replace('$', '') || '0') || 
                   2.93;

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

    if (serviceResult.success) {
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
    console.error('Order submission error:', error);
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

  try {
    const filter = await compileOrderFilters(req.user, req.query);

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('submittedBy', 'name username')
      .sort({ dateCreated: -1 })
      .skip(skip)
      .limit(limit);

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
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export order history as CSV
// @route   GET /api/orders/export
// @access  Private (Admin & Manager only)
export const exportOrdersCsv = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Not authorized to export CSV data' });
    }

    const filter = await compileOrderFilters(req.user, req.query);

    const orders = await Order.find(filter)
      .populate('submittedBy', 'name username')
      .sort({ dateCreated: -1 });

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

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=order_history.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order statistics based on user role
// @route   GET /api/orders/stats
// @access  Private
export const getOrderStats = async (req, res) => {
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
    console.error('Get order stats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

