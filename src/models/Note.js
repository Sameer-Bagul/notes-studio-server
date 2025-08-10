import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    default: '',
    required: false
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: false,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    default: 0,
    required: true
  },
  lastEditedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

noteSchema.pre('save', function(next) {
  this.lastEditedAt = new Date();
  next();
});

export default mongoose.model('Note', noteSchema);