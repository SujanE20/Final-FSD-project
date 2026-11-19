import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', default: null },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['todo', 'in-progress', 'completed', 'blocked'], default: 'todo' },
    projectName: { type: String, trim: true, maxlength: 120, default: '' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Task', taskSchema);
