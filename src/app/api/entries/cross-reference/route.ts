import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Entry } from "@/models/entry"
import { crossReference, updateUserRoadmap } from "@/lib/crossReference"

// POST /api/entries/cross-reference - Cross-reference approved entries with roadmap
export async function POST() {
    try {
        await connectDB()

        // Get all approved entries
        const entries = await Entry.find({ status: "approved" })
        console.log("[API] Found", entries.length, "approved entries to cross-reference")

        const results = {
            success: true,
            totalProcessed: entries.length,
            matchedCount: 0,
            errorCount: 0,
            errors: [] as { entryId: string; error: string }[]
        }

        // Process each entry
        for (const entry of entries) {
            try {
                console.log("[CrossReference] Processing entry:", entry._id)
                const match = await crossReference(entry)

                if (match) {
                    await updateUserRoadmap(entry, match)
                    results.matchedCount++
                } else {
                    console.log("[API] No match found for entry:", entry.title)
                }
            } catch (error) {
                console.error("[API] Error cross-referencing entry", entry._id + ":", error)
                results.errorCount++
                results.errors.push({
                    entryId: entry._id.toString(),
                    error: error instanceof Error ? error.message : "Unknown error"
                })
            }
        }

        return NextResponse.json(results)
    } catch (error) {
        console.error("[API] Error in cross-reference:", error)
        return NextResponse.json(
            { error: "Failed to cross-reference entries", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
} 