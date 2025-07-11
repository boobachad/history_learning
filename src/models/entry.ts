import mongoose, { Schema, type Document } from "mongoose"

// Interface for Entry document
export interface IEntry extends Document {
    url: string
    title: string
    timestamp: Date
    visitTime: number // seconds spent on page
    tags: string[]
    keywords: string[]
    primaryTopic: string
    confidence: number // 0-100 confidence score
    isVideo: boolean // flag to indicate if this is video content
    videoLength: number // total video length in seconds
    watchedLength: number // watched length in seconds
    status: "approved" | "pending" | "rejected"
    source: "chrome_extension" | "manual" | "import"
    summary?: string
    notes?: string
    createdAt: Date
    updatedAt: Date
    approvedAt?: Date
    crossReferencedAt?: Date // Track when entry was last cross-referenced
    metadata?: {
        processingData?: any
        userAgent?: string
        sessionId?: string
    }
}

// Entry Schema
const entrySchema = new Schema<IEntry>(
    {
        url: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        timestamp: {
            type: Date,
            required: true,
        },
        visitTime: {
            type: Number,
            default: 0,
            min: 0,
        },
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
                maxlength: 50,
            },
        ],
        keywords: [
            {
                type: String,
                trim: true,
                maxlength: 100,
            },
        ],
        primaryTopic: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 50,
        },
        isVideo: {
            type: Boolean,
            default: false,
        },
        videoLength: {
            type: Number,
            default: 0,
            min: 0,
        },
        watchedLength: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["approved", "pending", "rejected"],
            default: "pending",
        },
        source: {
            type: String,
            enum: ["chrome_extension", "manual", "import"],
            default: "chrome_extension",
        },
        summary: {
            type: String,
            maxlength: 1000,
        },
        notes: {
            type: String,
            maxlength: 2000,
        },
        approvedAt: {
            type: Date,
        },
        crossReferencedAt: {
            type: Date,
            default: null
        },
        metadata: {
            processingData: Schema.Types.Mixed,
            userAgent: String,
            sessionId: String,
        },
    },
    {
        timestamps: true,
        collection: "entries" // Explicit collection name
    }
)

// Create indexes (consolidated to avoid duplicates)
entrySchema.index({ url: 1, timestamp: 1 }, { unique: true })
entrySchema.index({ status: 1 })
entrySchema.index({ tags: 1 })
entrySchema.index({ timestamp: 1 })
entrySchema.index({ primaryTopic: 1 })

// Create model with explicit collection name
export const Entry = mongoose.models.Entry || mongoose.model<IEntry>("Entry", entrySchema, "entries")
