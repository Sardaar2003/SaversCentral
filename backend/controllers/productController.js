import Product from '../models/Product.js';
import Project from '../models/Project.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  const { projectId } = req.query;
  const filter = {};

  console.log(`[DEBUG][PRODUCT] Fetching products — projectId: "${projectId || 'all'}", user: "${req.user.username}" (role: ${req.user.role})`);

  if (projectId) {
    filter.project = projectId;
  }

  // Standard users can only see enabled products
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    filter.enabled = true;
    console.log(`[DEBUG][PRODUCT] Non-admin user — filtering to enabled products only`);
  }

  console.log(`[DEBUG][PRODUCT] Query filter:`, JSON.stringify(filter));

  try {
    const products = await Product.find(filter)
      .populate('project', 'name enabled')
      .sort({ name: 1 });
    console.log(`[DEBUG][PRODUCT] Found ${products.length} products`);
    products.forEach(p => {
      console.log(`[DEBUG][PRODUCT]   → "${p.name}" (key: ${p.key}, enabled: ${p.enabled}, campaignId: ${p.campaignId}, project: "${p.project?.name}")`);
    });
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('[DEBUG][PRODUCT] Get products ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new product under a project
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  const {
    name,
    key,
    projectId,
    connectionId,
    campaignId,
    offerId,
    trialPrice,
    monthlyPrice,
    serviceName,
  } = req.body;

  console.log(`[DEBUG][PRODUCT] Create product — name: "${name}", key: "${key}", projectId: "${projectId}", campaignId: ${campaignId}, offerId: ${offerId}`);

  if (!name || !key || !projectId || !connectionId || !campaignId || !offerId || !trialPrice || !monthlyPrice) {
    console.log(`[DEBUG][PRODUCT] Create REJECTED — missing required fields`);
    return res.status(400).json({ success: false, message: 'Please fill in all product fields' });
  }

  try {
    // Check if parent project exists
    const project = await Project.findById(projectId);
    if (!project) {
      console.log(`[DEBUG][PRODUCT] Create REJECTED — parent project not found (ID: ${projectId})`);
      return res.status(404).json({ success: false, message: 'Parent project not found' });
    }
    console.log(`[DEBUG][PRODUCT] Parent project found: "${project.name}"`);

    // Check if key is already taken
    const productExists = await Product.findOne({ key: key.trim().toLowerCase() });
    if (productExists) {
      console.log(`[DEBUG][PRODUCT] Create REJECTED — key "${key}" already exists (product: "${productExists.name}")`);
      return res.status(400).json({ success: false, message: 'Product key (slug) must be unique across all products' });
    }

    const product = await Product.create({
      name: name.trim(),
      key: key.trim().toLowerCase(),
      project: projectId,
      connectionId: Number(connectionId),
      campaignId: Number(campaignId),
      offerId: Number(offerId),
      trialPrice: trialPrice.trim(),
      monthlyPrice: monthlyPrice.trim(),
      serviceName: serviceName || 'sublytics',
      enabled: true,
    });

    const populatedProduct = await Product.findById(product._id).populate('project', 'name enabled');

    console.log(`[DEBUG][PRODUCT] Product created successfully — ID: ${product._id}, name: "${product.name}", key: "${product.key}"`);
    return res.status(201).json({ success: true, data: populatedProduct });
  } catch (error) {
    console.error('[DEBUG][PRODUCT] Create product ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle product enabled/disabled status
// @route   PATCH /api/products/:id/toggle
// @access  Private/Admin
export const toggleProduct = async (req, res) => {
  console.log(`[DEBUG][PRODUCT] Toggle product — ID: "${req.params.id}", by: "${req.user.username}"`);
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log(`[DEBUG][PRODUCT] Toggle REJECTED — product not found (ID: ${req.params.id})`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldEnabled = product.enabled;
    product.enabled = !product.enabled;
    await product.save();
    console.log(`[DEBUG][PRODUCT] Toggled "${product.name}" — ${oldEnabled} → ${product.enabled}`);

    const populatedProduct = await Product.findById(product._id).populate('project', 'name enabled');

    return res.json({ success: true, data: populatedProduct });
  } catch (error) {
    console.error('[DEBUG][PRODUCT] Toggle product ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
