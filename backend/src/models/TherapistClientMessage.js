import mongoose from 'mongoose';

const therapistClientMessageSchema = new mongoose.Schema(
  {
    therapistUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    clientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    senderRole: {
      type: String,
      enum: ['therapist', 'client'],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

therapistClientMessageSchema.index({ therapistUserId: 1, clientUserId: 1, createdAt: 1 });

export const TherapistClientMessage = mongoose.model('TherapistClientMessage', therapistClientMessageSchema);
