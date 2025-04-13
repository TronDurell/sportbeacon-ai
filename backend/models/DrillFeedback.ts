import { Schema, model, Document } from 'mongoose';

export interface IDrillFeedback extends Document {
    drillId: string;
    playerId: string;
    status: 'pending' | 'acknowledged' | 'completed';
    completedAt?: Date;
    performance: {
        score?: number;
        duration: number;
        difficulty: 1 | 2 | 3 | 4 | 5;
        enjoyment: 1 | 2 | 3 | 4 | 5;
    };
    feedback: {
        comment?: string;
        improvements?: string[];
        challenges?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const DrillFeedbackSchema = new Schema({
    drillId: {
        type: Schema.Types.ObjectId,
        ref: 'Drill',
        required: true
    },
    playerId: {
        type: Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'acknowledged', 'completed'],
        default: 'pending'
    },
    completedAt: {
        type: Date
    },
    performance: {
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        duration: {
            type: Number,
            required: true,
            min: 0
        },
        difficulty: {
            type: Number,
            min: 1,
            max: 5
        },
        enjoyment: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    feedback: {
        comment: String,
        improvements: [String],
        challenges: [String]
    }
}, {
    timestamps: true
});

// Index for efficient queries
DrillFeedbackSchema.index({ playerId: 1, drillId: 1 });
DrillFeedbackSchema.index({ status: 1, updatedAt: -1 });

export const DrillFeedback = model<IDrillFeedback>('DrillFeedback', DrillFeedbackSchema); 