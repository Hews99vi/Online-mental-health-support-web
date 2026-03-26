import mongoose from 'mongoose';

const clientResourceAssignmentSchema = new mongoose.Schema(
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
    libraryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryItem',
      required: true,
      index: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    note: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed'],
      default: 'assigned',
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

clientResourceAssignmentSchema.index({ therapistUserId: 1, clientUserId: 1, createdAt: -1 });

export const ClientResourceAssignment = mongoose.model('ClientResourceAssignment', clientResourceAssignmentSchema);
