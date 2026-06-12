import Product from '../models/Product.js';
import Project from '../models/Project.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  const { projectId } = req.query;
  const filter = {};

  if (projectId) {
    filter.project = projectId;
  }

  // Standard users can only see enabled products
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    filter.enabled = true;
  }

  try {
    const products = await Product.find(filter)
      .populate('project', 'name enabled')
      .sort({ name: 1 });
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
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

  if (!name || !key || !projectId || !connectionId || !campaignId || !offerId || !trialPrice || !monthlyPrice) {
    return res.status(400).json({ success: false, message: 'Please fill in all product fields' });
  }

  try {
    // Check if parent project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Parent project not found' });
    }

    // Check if key is already taken
    const productExists = await Product.findOne({ key: key.trim().toLowerCase() });
    if (productExists) {
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

    return res.status(201).json({ success: true, data: populatedProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle product enabled/disabled status
// @route   PATCH /api/products/:id/toggle
// @access  Private/Admin
export const toggleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.enabled = !product.enabled;
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate('project', 'name enabled');

    return res.json({ success: true, data: populatedProduct });
  } catch (error) {
    console.error('Toggle product error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
