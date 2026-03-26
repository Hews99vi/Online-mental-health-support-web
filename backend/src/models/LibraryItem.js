import mongoose from 'mongoose';

const libraryItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['article', 'podcast', 'video', 'exercise', 'guide'],
      default: 'article',
      index: true
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

libraryItemSchema.index({ status: 1, type: 1, category: 1, createdAt: -1 });

export const LibraryItem = mongoose.model('LibraryItem', libraryItemSchema);
