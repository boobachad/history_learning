import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { type IEntry, Entry } from "@/models/entry"
import { crossReference, updateUserRoadmap } from "@/lib/crossReference"

export async function POST(request: Request) {
    try {
        const data = await request.json()
        await connectDB()

        const entry = await Entry.findById(data.id)
        if (!entry) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 })
        }

        // Cross-reference the entry
        const match = await crossReference(entry)
        if (!match) {
            return NextResponse.json({ error: "No matching topic found" }, { status: 404 })
        }

        // Update the user roadmap
        await updateUserRoadmap(entry, match)

        return NextResponse.json({ success: true, match })
    } catch (error) {
        console.error("[ProcessEntry] Error:", error)
        return NextResponse.json(
            { error: "Failed to process entry", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
} 