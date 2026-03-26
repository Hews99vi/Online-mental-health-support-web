import mongoose from 'mongoose';

const listenerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    languages: { type: [String], default: [] },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectedReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

listenerProfileSchema.index({ verificationStatus: 1 });

export const ListenerProfile = mongoose.model('ListenerProfile', listenerProfileSchema);
