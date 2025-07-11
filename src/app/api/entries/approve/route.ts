import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { type IEntry, Entry } from "@/models/entry"
import { calculateConfidence } from "@/lib/roadmap"

// POST /api/entries/approve - Approve entries
export async function POST(request: NextRequest) {
    try {
        console.log("[API] Approving entries")

        const body = await request.json()
        const { entryIds } = body

        if (!Array.isArray(entryIds) || entryIds.length === 0) {
            return NextResponse.json({ error: "entryIds must be a non-empty array" }, { status: 400 })
        }

        await connectDB()

        const approvedEntries = []
        const errors = []

        // Process each entry
        for (const entryId of entryIds) {
            try {
                // Find entry
                const entry = await Entry.findById(entryId)
                if (!entry) {
                    errors.push({ entryId, error: "Entry not found" })
                    continue
                }

                // Check if already approved
                if (entry.status === "approved") {
                    errors.push({ entryId, error: "Entry already approved" })
                    continue
                }

                // Update entry status and confidence
                entry.status = "approved"
                entry.approvedAt = new Date()
                entry.confidence = calculateConfidence(entry)
                await entry.save()

                approvedEntries.push(entry)
                console.log(`[API] Approved entry: ${entry.title}`)
            } catch (error) {
                console.error(`[API] Error approving entry ${entryId}:`, error)
                errors.push({
                    entryId,
                    error: error instanceof Error ? error.message : "Unknown error",
                })
            }
        }

        return NextResponse.json({
            success: true,
            approved: approvedEntries.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error) {
        console.error("[API] Error in entries/approve:", error)
        return NextResponse.json(
            {
                error: "Failed to approve entries",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}