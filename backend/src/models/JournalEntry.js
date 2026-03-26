import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: '' },
    content: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
