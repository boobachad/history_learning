// Re-exporting interfaces from models for easier access throughout the application
import type { IEntry } from "@/models/entry"
import type { IUserRoadmap } from "@/models/roadmap"

export type { IEntry, IUserRoadmap }

// Define common status constants
export const EntryStatus = {
    APPROVED: "approved",
    PENDING: "pending",
    REJECTED: "rejected",
} as const

export const RoadmapStatus = {
    NOT_STARTED: "not-started",
    IN_PROGRESS: "in-progress",
    COMPLETED: "completed",
} as const

export const EntrySource = {
    CHROME_EXTENSION: "chrome_extension",
    MANUAL: "manual",
    IMPORT: "import",
} as const

export const RoadmapDifficulty = {
    BEGINNER: "beginner",
    INTERMEDIATE: "intermediate",
    ADVANCED: "advanced",
} as const

// Define a type for a generic API response with pagination
export interface PaginatedResponse<T> {
    entries: T[]
    pagination: {
        page: number
        limit: number
        totalCount: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
    filters?: {
        status?: string
        search?: string
        sort?: string
        tags?: string[]
        dateFrom?: string
        dateTo?: string
    }
}

// Define a type for a generic API success/error response
export interface ApiResponse {
    success: boolean
    message?: string
    error?: string
    details?: any
}
