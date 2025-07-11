// This file contains API client functions for interacting with the backend

import { type Entry, type RelatedEntry } from "@/types/entry";
import { type IUserRoadmapTopic, type IUserRoadmapSubtopic } from "@/models/roadmap";

// Fetch the user's learning roadmap
export async function fetchRoadmap() {
    const response = await fetch("/api/roadmap");
    if (!response.ok) {
        throw new Error("Failed to fetch roadmap");
    }
    const data = await response.json();
    // Ensure we return an array of topics
    return data.roadmap?.topics || [];
}

// Fetch recent learning entries
export async function fetchRecentEntries() {
    const response = await fetch("/api/entries?limit=6&sort=newest&status=all");
    if (!response.ok) {
        throw new Error("Failed to fetch recent entries");
    }
    const data = await response.json();
    return data.entries;
}

// Fetch learning statistics
export async function fetchStats() {
    const response = await fetch("/api/entries/count");
    if (!response.ok) {
        throw new Error("Failed to fetch stats");
    }
    const data = await response.json();
    const { total } = data.counts;
    return {
        total: total.approved + total.pending + total.rejected,
        pending: total.pending,
        approved: total.approved,
        rejected: total.rejected,
    };
}

// Fetch paginated entries with filters
export async function fetchEntries({ page = 1, status = "all", search = "", sort = "newest" }) {
    const params = new URLSearchParams({
        page: page.toString(),
        status,
        search,
        sort,
    });

    const response = await fetch(`/api/entries?${params}`);
    if (!response.ok) {
        throw new Error("Failed to fetch entries");
    }
    return response.json();
}

// Fetch a single entry by ID
export async function fetchEntry(id: string) {
    const response = await fetch(`/api/entries/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch entry");
    }
    return response.json();
}

// Update an entry
export async function updateEntry(id: string, updatedData: any) {
    const response = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
        throw new Error("Failed to update entry");
    }
    return response.json();
}

// Update topic order
export async function updateRoadmapOrder(topicId: string, newOrder: number, currentTopics: IUserRoadmapTopic[]) {
    console.log("[API] Updating topic order:", { topicId, newOrder });
    try {
        // Validate inputs
        if (!topicId || typeof topicId !== 'string') {
            throw new Error('Invalid topic ID');
        }
        if (typeof newOrder !== 'number' || newOrder < 0) {
            throw new Error('Invalid order number');
        }
        if (!Array.isArray(currentTopics)) {
            throw new Error('Invalid topics array');
        }

        // Validate topic exists
        const topicIndex = currentTopics.findIndex((t) => t.id === topicId);
        if (topicIndex === -1) {
            throw new Error(`Topic with ID ${topicId} not found`);
        }

        // Create new array with reordered topics
        const reorderedTopics = [...currentTopics];
        const [movedTopic] = reorderedTopics.splice(topicIndex, 1);
        reorderedTopics.splice(newOrder, 0, movedTopic);

        // Update order numbers
        reorderedTopics.forEach((topic, index) => {
            topic.order = index;
        });

        const response = await fetch("/api/roadmap", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "reorder",
                userId: "default",
                roadmap: { topics: reorderedTopics },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || "Failed to update roadmap order");
        }

        console.log("[API] Successfully updated topic order");
        return response.json();
    } catch (error) {
        console.error("[API] Error updating topic order:", error);
        throw error;
    }
}

// Update subtopic order within a topic
export async function updateSubtopicOrder(
    topicId: string,
    subtopicId: string,
    newOrder: number,
    currentTopics: IUserRoadmapTopic[]
) {
    console.log("[API] Updating subtopic order:", { topicId, subtopicId, newOrder });
    try {
        // Validate inputs
        if (!topicId || typeof topicId !== 'string') {
            throw new Error('Invalid topic ID');
        }
        if (!subtopicId || typeof subtopicId !== 'string') {
            throw new Error('Invalid subtopic ID');
        }
        if (typeof newOrder !== 'number' || newOrder < 0) {
            throw new Error('Invalid order number');
        }
        if (!Array.isArray(currentTopics)) {
            throw new Error('Invalid topics array');
        }

        // Validate topic exists
        const topicIndex = currentTopics.findIndex((t) => t.id === topicId);
        if (topicIndex === -1) {
            throw new Error(`Topic with ID ${topicId} not found`);
        }

        // Validate subtopic exists
        const subtopics = [...currentTopics[topicIndex].subtopics];
        const subtopicIndex = subtopics.findIndex((s) => s.id === subtopicId);
        if (subtopicIndex === -1) {
            throw new Error(`Subtopic with ID ${subtopicId} not found`);
        }

        // Create new array with reordered subtopics
        const [movedSubtopic] = subtopics.splice(subtopicIndex, 1);
        subtopics.splice(newOrder, 0, movedSubtopic);

        // Update order numbers
        subtopics.forEach((subtopic, index) => {
            subtopic.order = index;
        });

        // Create new topics array with updated subtopics
        const reorderedTopics = [...currentTopics];
        reorderedTopics[topicIndex].subtopics = subtopics;

        const response = await fetch("/api/roadmap", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "reorder",
                userId: "default",
                roadmap: { topics: reorderedTopics },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || "Failed to update subtopic order");
        }

        console.log("[API] Successfully updated subtopic order");
        return response.json();
    } catch (error) {
        console.error("[API] Error updating subtopic order:", error);
        throw error;
    }
}

// Fetch related entries
export async function fetchRelatedEntries(tags: string[], currentId: string): Promise<RelatedEntry[]> {
    const params = new URLSearchParams({
        tags: tags.join(","),
        excludeId: currentId,
        limit: "3",
    });

    const response = await fetch(`/api/entries?${params}`);
    if (!response.ok) {
        throw new Error("Failed to fetch related entries");
    }
    const data = await response.json();
    return data.entries;
}

// Mark topic or subtopic as completed
export async function markTopicAsCompleted(topicId: string, subtopicId?: string) {
    const response = await fetch(`/api/roadmap/${topicId}/complete${subtopicId ? `?subtopicId=${subtopicId}` : ""}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to mark as completed");
    }

    return response.json();
}