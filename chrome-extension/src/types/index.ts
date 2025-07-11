/// <reference types="chrome"/>

// Define PendingEntry type locally for Chrome extension
export interface PendingEntry {
    _id: string
    url: string
    title: string
    timestamp: string
    tags: string[]
    status: "pending"
    confidence: number
    videoLength: number
    watchedLength: number
}

export interface HistoryItem {
    url: string
    title: string
    timestamp: string
    visitTime: number
    videoLength?: number
    watchedLength?: number
}

export interface TrackingState {
    isTracking: boolean
    startTime: string | null
    stopTime: string | null
}

export interface SyncStatus {
    status: "idle" | "in-progress" | "completed" | "error"
    error?: string
}

export interface ProcessedItem {
    id: string
    title: string
    url: string
    tags: string[]
    status: "pending" | "processing" | "failed"
}

export interface ChromeMessage {
    type: string
    status?: string
    message?: string
    startTime?: string
    stopTime?: string
    endTime?: string
    items?: HistoryItem[]
    item?: HistoryItem
    pendingEntries?: PendingEntry[]
    error?: string
}

export interface StorageChange {
    [key: string]: chrome.storage.StorageChange
}

// Chrome API types
declare global {
    interface Window {
        chrome: typeof chrome
    }
} 