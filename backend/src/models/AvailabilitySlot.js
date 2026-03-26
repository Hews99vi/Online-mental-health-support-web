import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema(
  {
    therapistUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isBooked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

availabilitySlotSchema.index({ therapistUserId: 1, startTime: 1 }, { unique: true });

export const AvailabilitySlot = mongoose.model('AvailabilitySlot', availabilitySlotSchema);
