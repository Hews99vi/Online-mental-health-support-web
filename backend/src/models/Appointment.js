import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'cancelled', 'completed'],
      default: 'requested'
    },
    sessionProvider: {
      type: String,
      enum: ['jitsi'],
      default: null
    },
    sessionRoomName: { type: String, default: '' },
    sessionCreatedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    therapistNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

appointmentSchema.index({ therapistUserId: 1, status: 1, createdAt: -1 });
appointmentSchema.index({ userId: 1, createdAt: -1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
