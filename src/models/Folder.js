import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [50, 'Folder name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  color: {
    type: String,
    default: null
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeployed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Folder', folderSchema);
