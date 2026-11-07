import mongoose from 'mongoose';
import env from '../../config/env.js';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    status: { type: String, enum: ['new', 'read'], default: 'new' },
    emailed: { type: Boolean, default: false },
    ipHash: { type: String, select: false },
    userAgent: { type: String, maxlength: 300, select: false },
    // Deleted automatically by MongoDB after CONTACT_RETENTION_DAYS.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, strict: 'throw' },
);

contactMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
contactMessageSchema.index({ createdAt: -1 });

export const retentionDate = () => new Date(Date.now() + env.CONTACT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

export default mongoose.model('ContactMessage', contactMessageSchema);
