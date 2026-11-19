import mongoose from 'mongoose';

const executionStepSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true },
    nodeType: { type: String, required: true },
    label: { type: String, default: '' },
    status: { type: String, enum: ['success', 'skipped', 'failed'], required: true },
    message: { type: String, default: '' },
    output: { type: mongoose.Schema.Types.Mixed, default: null },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { _id: false },
);

const executionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    workflowName: { type: String, required: true },
    status: { type: String, enum: ['running', 'success', 'failed'], default: 'running' },
    triggerType: { type: String, default: 'manual' },
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, default: null },
    nodes: { type: [executionStepSchema], default: [] },
    errorDetails: { type: String, default: '' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

executionSchema.index({ userId: 1, startedAt: -1 });

export default mongoose.model('Execution', executionSchema);
