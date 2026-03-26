import mongoose from 'mongoose';

const therapistProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    avatarUrl: { type: String, default: null },
    licenseNo: { type: String, required: true, trim: true },
    licenseBody: { type: String, default: '', trim: true },
    specialization: { type: [String], default: [] },
    languages: { type: [String], default: ['English'] },
    bio: { type: String, default: '' },
    yearsExperience: { type: Number, default: 0, min: 0 },
    ratePerHour: { type: Number, default: 7000, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    education: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    documents: {
      type: [
        {
          name: { type: String, default: '', trim: true },
          mimeType: { type: String, default: '', trim: true },
          size: { type: Number, default: 0, min: 0 },
          lastModified: { type: Number, default: 0 },
          source: { type: String, enum: ['metadata'], default: 'metadata' }
        }
      ],
      default: []
    },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectedReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

therapistProfileSchema.index({ verificationStatus: 1 });

export const TherapistProfile = mongoose.model('TherapistProfile', therapistProfileSchema);
