import { stringSimilarity } from "string-similarity-js"
import type { IEntry } from "@/models/entry"
import type { IUserRoadmap, IUserRoadmapEntry, IUserRoadmapSubtopic, IUserRoadmapTopic } from "@/models/roadmap"
import roadmapsData from "@/data/roadmaps/rdmps1.json"
import mongoose from 'mongoose';
import { calculateProgress } from "@/lib/roadmap"
import { UserRoadmap } from "@/models/roadmap"

interface CrossReferenceResult {
    topicId: string
    subtopicId: string | null
    confidence: number
    matchedText: string
    topicName: string
    subtopicName?: string
}

// Initialize user roadmap with topics from rdmps1.json
async function initializeUserRoadmap() {
    try {
        // Check if user roadmap exists
        let roadmap = await UserRoadmap.findOne({ userId: "default", isActive: true });

        if (!roadmap) {
            // Get the first roadmap from the JSON file
            const defaultRoadmap = Array.isArray(roadmapsData) ? roadmapsData[0] : roadmapsData;

            // Create new roadmap with topics from JSON
            roadmap = new UserRoadmap({
                userId: "default",
                isActive: true,
                roadmap: {
                    id: defaultRoadmap.id || "default",
                    name: defaultRoadmap.name,
                    description: defaultRoadmap.description,
                    topics: defaultRoadmap.topics.map((topic: any) => ({
                        ...topic,
                        progress: 0,
                        status: "in_progress",
                        entries: [],
                        subtopics: topic.subtopics.map((subtopic: any) => ({
                            ...subtopic,
                            progress: 0,
                            status: "in_progress",
                            entries: []
                        }))
                    }))
                }
            });

            // Add Miscellaneous topic
            roadmap.roadmap.topics.push({
                id: "miscellaneous",
                name: "Miscellaneous",
                description: "Entries that don't match any specific topic",
                order: roadmap.roadmap.topics.length + 1,
                progress: 0,
                status: "in_progress",
                entries: [],
                subtopics: []
            });

            await roadmap.save();
            console.log("[CrossReference] Initialized user roadmap");
        }

        return roadmap;
    } catch (error) {
        console.error("[CrossReference] Error initializing roadmap:", error);
        throw error;
    }
}

export async function crossReference(entry: IEntry): Promise<CrossReferenceResult | null> {
    // Initialize roadmap if needed
    await initializeUserRoadmap();

    // Get the first roadmap from the JSON file
    const roadmap = Array.isArray(roadmapsData) ? roadmapsData[0] : roadmapsData;
    if (!roadmap) return null;

    let bestMatch: CrossReferenceResult | null = null;
    let highestConfidence = 0;

    // Combine title and tags for matching
    const searchText = `${entry.title} ${entry.tags.join(" ")}`.toLowerCase();

    // Check each topic
    for (const topic of roadmap.topics) {
        // Check topic name
        const topicConfidence = stringSimilarity(searchText, topic.name.toLowerCase());
        if (topicConfidence > highestConfidence && topicConfidence > 0.3) {
            highestConfidence = topicConfidence;
            bestMatch = {
                topicId: topic.id,
                subtopicId: null,
                confidence: topicConfidence,
                matchedText: topic.name,
                topicName: topic.name
            };
        }

        // Check subtopics
        for (const subtopic of topic.subtopics) {
            const subtopicConfidence = stringSimilarity(searchText, subtopic.name.toLowerCase());
            if (subtopicConfidence > highestConfidence && subtopicConfidence > 0.3) {
                highestConfidence = subtopicConfidence;
                bestMatch = {
                    topicId: topic.id,
                    subtopicId: subtopic.id,
                    confidence: subtopicConfidence,
                    matchedText: subtopic.name,
                    topicName: topic.name,
                    subtopicName: subtopic.name
                };
            }
        }
    }

    // If no match found, use Miscellaneous topic
    if (!bestMatch) {
        bestMatch = {
            topicId: "miscellaneous",
            subtopicId: null,
            confidence: 100,
            matchedText: "Miscellaneous",
            topicName: "Miscellaneous"
        };
    }

    // Validate the match before returning
    if (bestMatch) {
        // Ensure confidence is between 0 and 100
        bestMatch.confidence = Math.min(Math.max(bestMatch.confidence * 100, 0), 100);

        // Validate required fields
        if (!bestMatch.topicId || !bestMatch.topicName) {
            console.warn("[CrossReference] Invalid match: missing required fields", bestMatch);
            return null;
        }

        // If there's a subtopic, validate its fields
        if (bestMatch.subtopicId && !bestMatch.subtopicName) {
            console.warn("[CrossReference] Invalid match: missing subtopic name", bestMatch);
            return null;
        }
    }

    return bestMatch;
}

export async function updateUserRoadmap(entry: IEntry, match: CrossReferenceResult) {
    try {
        console.log("[CrossReference] Updating roadmap for entry:", entry._id);

        // Find the active roadmap
        const roadmap = await UserRoadmap.findOne({ userId: "default", isActive: true });
        if (!roadmap) {
            throw new Error("No active roadmap found");
        }

        // Find the topic
        const topic = roadmap.roadmap.topics.find((t: IUserRoadmapTopic) => t.id === match.topicId);
        if (!topic) {
            throw new Error(`Topic ${match.topicId} not found`);
        }

        // Check if entry already exists in the topic
        const entryExists = topic.entries.some((e: { entryId: string }) => e.entryId === entry._id);
        if (entryExists) {
            console.log("[CrossReference] Entry already exists in topic, skipping");
            return;
        }

        // Add entry to topic
        topic.entries.push({
            entryId: entry._id,
            confidence: match.confidence,
            title: entry.title,
            url: entry.url,
            createdAt: entry.createdAt,
            tags: entry.tags || []
        });

        // If there's a subtopic match, add to subtopic as well
        if (match.subtopicId) {
            const subtopic = topic.subtopics.find((s: IUserRoadmapSubtopic) => s.id === match.subtopicId);
            if (subtopic) {
                // Check if entry already exists in the subtopic
                const entryExistsInSubtopic = subtopic.entries.some((e: { entryId: string }) => e.entryId === entry._id);
                if (!entryExistsInSubtopic) {
                    subtopic.entries.push({
                        entryId: entry._id,
                        confidence: match.confidence,
                        title: entry.title,
                        url: entry.url,
                        createdAt: entry.createdAt,
                        tags: entry.tags || []
                    });
                }
            }
        }

        // Save the updated roadmap
        await roadmap.save();
        console.log("[CrossReference] Roadmap updated successfully");
    } catch (error) {
        console.error("[CrossReference] Error updating roadmap:", error);
        throw error;
    }
}