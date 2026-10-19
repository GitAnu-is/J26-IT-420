const mongoose = require('mongoose');

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for refresh session'],
      index: true
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true
    },
    familyId: {
      type: String,
      required: [true, 'Session family ID is required for rotation tracking'],
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    replacedByTokenHash: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast query lookups during rotation and logout
refreshSessionSchema.index({ userId: 1, isRevoked: 1 });
refreshSessionSchema.index({ familyId: 1, isRevoked: 1 });

const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);

module.exports = RefreshSession;
