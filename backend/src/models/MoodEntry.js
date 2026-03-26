import mongoose from 'mongoose';

const moodEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    moodScore: { type: Number, required: true, min: 1, max: 5 },
    tags: { type: [String], default: [] },
    note: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const MoodEntry = mongoose.model('MoodEntry', moodEntrySchema);
