import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    name: { type: String, trim: true, maxlength: 60 },
    status: {
      type: String,
      enum: ['pending', 'subscribed', 'unsubscribed'],
      default: 'pending',
    },
    consentAt: { type: Date, required: true },
    source: { type: String, default: 'website', maxlength: 40 },
    ipHash: { type: String, select: false },
    userAgent: { type: String, maxlength: 300, select: false },
  },
  { timestamps: true, strict: 'throw' },
);

export default mongoose.model('Subscriber', subscriberSchema);
