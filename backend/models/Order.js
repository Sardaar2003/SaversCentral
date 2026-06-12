import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  campaignId: {
    type: Number,
    required: true,
  },
  offerId: {
    type: Number,
    required: true,
  },
  connectionId: {
    type: Number,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    trim: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  apiPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for query performance
orderSchema.index({ projectId: 1, dateCreated: -1 });
orderSchema.index({ productId: 1, dateCreated: -1 });
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ submittedBy: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
