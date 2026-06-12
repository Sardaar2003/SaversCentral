import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  key: {
    type: String,
    unique: true,
    sparse: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
