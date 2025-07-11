import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserRoadmap, type IUserRoadmap, type IUserRoadmapTopic, type IUserRoadmapSubtopic } from "@/models/roadmap";
import { Entry, type IEntry } from "@/models/entry";
import { crossReference, updateUserRoadmap } from "@/lib/crossReference";
import { calculateProgress } from "@/lib/roadmap";
import { Document } from "mongoose";

// Type for roadmap response
interface RoadmapResponse {
    roadmap: {
        id: string;
        name: string;
        description?: string;
        topics: IUserRoadmapTopic[];
    };
    metadata: {
        userId: string;
        lastUpdated: Date;
        overallProgress: number;
    };
}

// Type for MongoDB document with _id
type WithId<T> = T & { _id: string };

// Type for lean MongoDB document
type LeanWithId<T> = Omit<T & { _id: string }, keyof Document>;

// Type for roadmap document
interface RoadmapDocument {
    _id: string;
    userId: string;
    roadmap: {
        id: string;
        name: string;
        description?: string;
        topics: IUserRoadmapTopic[];
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Type for lean roadmap document
type LeanRoadmapDocument = Omit<RoadmapDocument, keyof Document>;

// GET /api/roadmap - Fetch user's learning roadmap
export async function GET(request: NextRequest) {
    try {
        console.log("[API] Fetching user roadmap");

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId") || "default";

        await connectDB();

        // Use findOneAndUpdate with upsert to ensure atomic operation
        const userRoadmap = await UserRoadmap.findOneAndUpdate(
            { userId, isActive: true },
            {
                $setOnInsert: {
                    isActive: true,
                    roadmap: {
                        id: "default",
                        name: "My Learning Path",
                        description: "Your learning roadmap will be created as you approve entries",
                        topics: []
                    }
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        ).lean() as LeanWithId<IUserRoadmap> | null;

        if (!userRoadmap) {
            return NextResponse.json({
                roadmap: {
                    id: "empty_roadmap",
                    name: "My Learning Path",
                    description: "Your learning roadmap will be created as you approve entries",
                    topics: [],
                },
                metadata: {
                    userId,
                    lastUpdated: new Date(),
                    overallProgress: 0,
                },
            } satisfies RoadmapResponse);
        }

        // Get full documents for cross-referencing
        const approvedEntries = await Entry.find({ status: "approved" });

        // Process entries in batches to prevent race conditions
        const BATCH_SIZE = 10;
        for (let i = 0; i < approvedEntries.length; i += BATCH_SIZE) {
            const batch = approvedEntries.slice(i, i + BATCH_SIZE);
            await Promise.all(
                batch.map(async (entry) => {
                    try {
                        const match = crossReference(entry);
                        if (match) {
                            // Use findOneAndUpdate for atomic updates
                            await UserRoadmap.findOneAndUpdate(
                                { userId, isActive: true },
                                {
                                    $push: {
                                        "roadmap.topics.$[topic].entries": {
                                            entryId: entry._id.toString(),
                                            confidence: entry.confidence,
                                            title: entry.title,
                                            url: entry.url,
                                            createdAt: entry.createdAt,
                                            tags: entry.tags
                                        }
                                    }
                                },
                                {
                                    arrayFilters: [{ "topic.id": match.topicId }],
                                    new: true
                                }
                            );
                        }
                    } catch (error) {
                        console.error(`[API] Error cross-referencing entry ${entry._id}:`, error);
                    }
                })
            );
        }

        // Fetch the updated roadmap
        const updatedRoadmap = await UserRoadmap.findOne({ userId, isActive: true }).lean() as unknown as LeanRoadmapDocument;
        if (!updatedRoadmap) {
            throw new Error("Failed to fetch updated roadmap");
        }

        // Validate and process topics
        const validTopics = updatedRoadmap.roadmap.topics.map(topic => ({
            ...topic,
            progress: Math.min(Math.max(topic.progress, 0), 100), // Ensure progress is between 0 and 100
            subtopics: topic.subtopics.map(subtopic => ({
                ...subtopic,
                progress: Math.min(Math.max(subtopic.progress, 0), 100), // Ensure progress is between 0 and 100
            })),
        }));

        const overallProgress = validTopics.length > 0
            ? Math.round(validTopics.reduce((acc, topic) => acc + topic.progress, 0) / validTopics.length)
            : 0;

        return NextResponse.json({
            roadmap: {
                id: updatedRoadmap.roadmap.id,
                name: updatedRoadmap.roadmap.name,
                description: updatedRoadmap.roadmap.description,
                topics: validTopics,
            },
            metadata: {
                userId: updatedRoadmap.userId,
                lastUpdated: new Date(),
                overallProgress,
            },
        } satisfies RoadmapResponse);
    } catch (error) {
        console.error("[API] Error in roadmap:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch roadmap",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// PUT /api/roadmap - Update roadmap (reordering, edits)
export async function PUT(request: NextRequest) {
    try {
        console.log("[API] Updating user roadmap");

        const body = await request.json();
        const { userId = "default", roadmap, action = "update" } = body;

        if (!userId || !roadmap || !Array.isArray(roadmap.topics)) {
            return NextResponse.json(
                { error: "Invalid payload: userId and roadmap.topics required" },
                { status: 400 }
            );
        }

        await connectDB();

        if (action === "reorder") {
            // For reordering, only update the order numbers
            const updates = roadmap.topics.map((topic: IUserRoadmapTopic, index: number) => ({
                updateOne: {
                    filter: { userId, "roadmap.topics.id": topic.id },
                    update: { $set: { "roadmap.topics.$.order": index } }
                }
            }));

            // Update subtopic orders if provided
            const subtopicUpdates = roadmap.topics.flatMap((topic: IUserRoadmapTopic) =>
                topic.subtopics.map((subtopic: IUserRoadmapSubtopic, index: number) => ({
                    updateOne: {
                        filter: {
                            userId,
                            "roadmap.topics.id": topic.id,
                            "roadmap.topics.subtopics.id": subtopic.id
                        },
                        update: { $set: { "roadmap.topics.$[topic].subtopics.$[subtopic].order": index } },
                        arrayFilters: [
                            { "topic.id": topic.id },
                            { "subtopic.id": subtopic.id }
                        ]
                    }
                }))
            );

            // Perform all updates in a single bulk operation
            await UserRoadmap.bulkWrite([...updates, ...subtopicUpdates]);

            return NextResponse.json({ success: true });
        }

        // For other updates, validate roadmap structure
        for (const topic of roadmap.topics as IUserRoadmapTopic[]) {
            if (!topic.id || !topic.name || typeof topic.order !== 'number') {
                return NextResponse.json(
                    { error: "Invalid topic structure: id, name, and order are required" },
                    { status: 400 }
                );
            }

            for (const subtopic of topic.subtopics || []) {
                if (!subtopic.id || !subtopic.name || typeof subtopic.order !== 'number') {
                    return NextResponse.json(
                        { error: "Invalid subtopic structure: id, name, and order are required" },
                        { status: 400 }
                    );
                }
            }
        }

        const existingRoadmap = await UserRoadmap.findOne({ userId, isActive: true });
        if (!existingRoadmap) {
            return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
        }

        // Update the roadmap
        existingRoadmap.roadmap = roadmap;
        await existingRoadmap.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API] Error updating roadmap:", error);
        return NextResponse.json(
            {
                error: "Failed to update roadmap",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}