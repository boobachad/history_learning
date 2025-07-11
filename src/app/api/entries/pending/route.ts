import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { type IEntry, Entry } from "@/models/entry"

// GET /api/entries/pending - Fetch pending entries for holding area
export async function GET(request: Request) {
    try {
        await connectDB()

        const entries = await Entry.find({ status: "pending" })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean()

        return NextResponse.json(entries)
    } catch (error) {
        console.error("[PendingEntries] Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch pending entries", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
