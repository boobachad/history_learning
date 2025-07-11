import mongoose, { Schema, type Document } from "mongoose"
import { type IEntry } from "./entry"

// Interface for UserRoadmap Entry
export interface IUserRoadmapEntry {
    entryId: string
    confidence: number
    title?: string
    url?: string
    createdAt?: Date
    updatedAt?: Date
    tags?: string[]
}

// Interface for UserRoadmap Subtopic
export interface IUserRoadmapSubtopic {
    id: string
    name: string
    description?: string
    order: number
    progress: number
    status: "completed" | "in_progress"
    entries: IUserRoadmapEntry[]
}

// Interface for UserRoadmap Topic
export interface IUserRoadmapTopic {
    id: string
    name: string
    description?: string
    order: number
    progress: number
    status: "completed" | "in_progress"
    subtopics: IUserRoadmapSubtopic[]
    entries: IUserRoadmapEntry[]
}

// Interface for UserRoadmap document
export interface IUserRoadmap extends Document {
    userId: string
    roadmap: {
        id: string
        name: string
        description?: string
        topics: IUserRoadmapTopic[]
    }
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

// User Roadmap Schema
const userRoadmapSchema = new Schema<IUserRoadmap>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        roadmap: {
            id: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            description: String,
            topics: [
                {
                    id: {
                        type: String,
                        required: true,
                    },
                    name: {
                        type: String,
                        required: true,
                    },
                    description: String,
                    order: {
                        type: Number,
                        required: true,
                    },
                    progress: {
                        type: Number,
                        default: 0,
                        min: 0,
                        max: 100,
                    },
                    status: {
                        type: String,
                        enum: ["completed", "in_progress"],
                        default: "in_progress"
                    },
                    subtopics: [
                        {
                            id: {
                                type: String,
                                required: true,
                            },
                            name: {
                                type: String,
                                required: true,
                            },
                            description: String,
                            order: {
                                type: Number,
                                required: true,
                            },
                            progress: {
                                type: Number,
                                default: 0,
                                min: 0,
                                max: 100,
                            },
                            status: {
                                type: String,
                                enum: ["completed", "in_progress"],
                                default: "in_progress"
                            },
                            entries: [
                                {
                                    entryId: {
                                        type: String,
                                        required: true,
                                    },
                                    confidence: {
                                        type: Number,
                                        required: true,
                                    },
                                    title: String,
                                    url: String,
                                    createdAt: Date,
                                    updatedAt: Date,
                                    tags: [String]
                                }
                            ]
                        }
                    ],
                    entries: [
                        {
                            entryId: {
                                type: String,
                                required: true,
                            },
                            confidence: {
                                type: Number,
                                required: true,
                            },
                            title: String,
                            url: String,
                            createdAt: Date,
                            updatedAt: Date,
                            tags: [String]
                        }
                    ]
                }
            ]
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true,
        collection: "user_roadmaps"
    }
)

// Create indexes
userRoadmapSchema.index({ userId: 1, isActive: 1 }, { unique: true })
userRoadmapSchema.index({ "roadmap.topics.id": 1 })

// Create model
export const UserRoadmap = mongoose.models.UserRoadmap || mongoose.model<IUserRoadmap>("UserRoadmap", userRoadmapSchema, "user_roadmaps")