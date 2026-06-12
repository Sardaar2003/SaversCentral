import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  connectionId: {
    type: Number,
    required: true,
  },
  campaignId: {
    type: Number,
    required: true,
  },
  offerId: {
    type: Number,
    required: true,
  },
  trialPrice: {
    type: String,
    required: true,
  },
  monthlyPrice: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  serviceName: {
    type: String,
    default: 'sublytics',
  },
}, {
  timestamps: true,
});

// Compound index to ensure uniqueness of product name within the same project
productSchema.index({ name: 1, project: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
