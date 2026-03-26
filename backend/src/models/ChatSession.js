import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['queued', 'active', 'closed'],
      default: 'queued',
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    listenerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatSessionSchema.index({ status: 1, createdAt: 1 });

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
