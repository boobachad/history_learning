import { stringSimilarity } from "string-similarity-js"
import { UserRoadmap, type IUserRoadmap } from "@/models/roadmap"
import type { IEntry } from "@/models/entry"

/**
 * Calculates the confidence score for an entry based on various factors.
 * @param entry The entry to calculate confidence for
 * @returns A number between 0 and 100 representing confidence
 */
export function calculateConfidence(entry: IEntry): number {
    // Base confidence starts at 50
    let confidence = 50

    // Add points for having a title
    if (entry.title) {
        confidence += 10
    }

    // Add points for tags
    if (entry.tags && entry.tags.length > 0) {
        confidence += Math.min(entry.tags.length * 5, 20) // Up to 20 points for tags
    }

    // Add points for having a primary topic
    if (entry.primaryTopic) {
        confidence += 10
    }

    // Add points for having a summary
    if (entry.summary) {
        confidence += 10
    }

    // Add points for video completion if applicable
    if (entry.isVideo && entry.videoLength && entry.watchedLength) {
        const completionRatio = entry.watchedLength / entry.videoLength
        confidence += Math.round(completionRatio * 25) // Up to 25 points for video completion
    }

    // Add points for learning status keywords
    if (entry.title.toLowerCase().includes("completed")) {
        confidence += 20
    } else if (entry.title.toLowerCase().includes("revising")) {
        confidence += 15
    }

    // Add points for learning indicators in tags
    if (entry.tags.some((tag) => ["tutorial", "course", "learn"].includes(tag.toLowerCase()))) {
        confidence += 25
    }

    // Add points for approved status
    if (entry.status === "approved") {
        confidence += 20
            }

    // Cap confidence at 100
    return Math.min(confidence, 100)
}

/**
 * Fetches the user's learning roadmap.
 * @param userId The user ID to fetch roadmap for
 * @returns The user's roadmap or null if not found
 */
export async function fetchRoadmap(userId: string = "default"): Promise<IUserRoadmap | null> {
    const userRoadmap = await UserRoadmap.findOne({ userId, isActive: true })
    return userRoadmap
}

/**
 * Calculates the progress for a topic or subtopic based on its entries.
 * @param entries Array of entries with confidence scores and timestamps
 * @returns A number between 0 and 100 representing progress
 */
export function calculateProgress(entries: Array<{ confidence: number; createdAt?: Date | string }>): number {
    if (!entries || entries.length === 0) return 0;

    // Filter out entries with invalid confidence scores
    const validEntries = entries.filter(entry =>
        typeof entry.confidence === 'number' &&
        !isNaN(entry.confidence) &&
        entry.confidence >= 0 &&
        entry.confidence <= 100
    );

    if (validEntries.length === 0) return 0;

    // Calculate weighted average based on recency and confidence
    const now = Date.now();
    const totalWeight = validEntries.reduce((acc, entry) => {
        const entryDate = entry.createdAt ? new Date(entry.createdAt).getTime() : now;
        const daysOld = (now - entryDate) / (1000 * 60 * 60 * 24);
        const recencyWeight = Math.max(0, 1 - (daysOld / 30)); // Weight decreases over 30 days
        return acc + recencyWeight;
    }, 0);

    if (totalWeight === 0) return 0;

    const weightedConfidence = validEntries.reduce((acc, entry) => {
        const entryDate = entry.createdAt ? new Date(entry.createdAt).getTime() : now;
        const daysOld = (now - entryDate) / (1000 * 60 * 60 * 24);
        const recencyWeight = Math.max(0, 1 - (daysOld / 30));
        return acc + (entry.confidence * recencyWeight);
    }, 0);

    const averageConfidence = weightedConfidence / totalWeight;

    // Round to nearest integer and ensure it's between 0 and 100
    return Math.min(Math.max(Math.round(averageConfidence), 0), 100);
}
