import mongoose from 'mongoose';

const userConsentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    termsAccepted: { type: Boolean, default: true },
    privacyAccepted: { type: Boolean, default: true },
    biometricConsent: { type: Boolean, default: false },
    aiConsent: { type: Boolean, default: true },
    analyticsConsent: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const UserConsent = mongoose.model('UserConsent', userConsentSchema);
