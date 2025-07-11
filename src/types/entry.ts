import type { IEntry } from "@/models/entry"

// Re-export the IEntry interface as Entry for frontend use
export type Entry = Omit<IEntry, keyof Document> & {
    _id: string
    createdAt: string
    updatedAt: string
    approvedAt?: string
    title: string
    url: string
    timestamp: string
    visitTime: number
    tags: string[]
    keywords: string[]
    primaryTopic: string
    confidence: number
    isVideo: boolean
    videoLength: number
    watchedLength: number
    status: "approved" | "pending" | "rejected"
    source: "chrome_extension" | "manual" | "import"
    summary?: string
    notes?: string
}

// Type for entries that are pending processing
export type PendingEntry = Pick<Entry, '_id' | 'url' | 'title' | 'timestamp' | 'tags' | 'status' | 'confidence' | 'videoLength' | 'watchedLength'>

// Type for related entries in the UI
export type RelatedEntry = Pick<Entry, '_id' | 'title' | 'url' | 'timestamp' | 'tags' | 'status'>

// Type for entry input (excluding auto-generated fields)
export type EntryInput = Omit<Entry, '_id' | 'createdAt' | 'updatedAt' | 'approvedAt'> 