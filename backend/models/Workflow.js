import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['draft', 'active', 'inactive'], default: 'draft' },
    nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    edges: { type: [mongoose.Schema.Types.Mixed], default: [] },
    lastExecutedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

workflowSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Workflow', workflowSchema);
