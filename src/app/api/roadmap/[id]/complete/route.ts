import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { type IUserRoadmap, type IUserRoadmapTopic, UserRoadmap } from "@/models/roadmap"

// PUT /api/roadmap/[id]/complete - Mark a topic or subtopic as completed
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const { searchParams } = new URL(request.url)
        const subtopicId = searchParams.get("subtopicId")

        await connectDB()

        let updateQuery: any = {}
        let arrayFilters: any[] = []

        if (subtopicId) {
            // Update subtopic
            updateQuery = {
                $set: {
                    "roadmap.topics.$[topic].subtopics.$[subtopic].progress": 100,
                    "roadmap.topics.$[topic].subtopics.$[subtopic].status": "completed"
                }
            }
            arrayFilters = [
                { "topic.id": id },
                { "subtopic.id": subtopicId }
            ]
        } else {
            // Update topic
            updateQuery = {
                $set: {
                    "roadmap.topics.$[topic].progress": 100,
                    "roadmap.topics.$[topic].status": "completed"
                }
            }
            arrayFilters = [{ "topic.id": id }]
        }

        // Find and update the roadmap
        const updatedRoadmap = await UserRoadmap.findOneAndUpdate(
            { userId: "default", isActive: true },
            updateQuery,
            {
                arrayFilters,
                new: true
            }
        )

        if (!updatedRoadmap) {
            return NextResponse.json({ error: "Roadmap not found" }, { status: 404 })
        }

        // Find the updated topic/subtopic
        const topic = updatedRoadmap.roadmap.topics.find((t: IUserRoadmapTopic) => t.id === id)
        if (!topic) {
            return NextResponse.json({ error: "Topic not found" }, { status: 404 })
        }

        if (subtopicId) {
            const subtopic = topic.subtopics.find(s => s.id === subtopicId)
            if (!subtopic) {
                return NextResponse.json({ error: "Subtopic not found" }, { status: 404 })
            }
            return NextResponse.json({ topic, subtopic })
        }

        return NextResponse.json({ topic })
    } catch (error) {
        console.error("[CompleteTopic] Error:", error)
        return NextResponse.json(
            { error: "Failed to complete topic", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
} 