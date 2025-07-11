import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Entry, type IEntry } from "@/models/entry"
import { isValidObjectId } from "mongoose"
import { crossReference, updateUserRoadmap } from "@/lib/crossReference"
import { calculateConfidence } from "@/lib/roadmap"

// GET /api/entries/[id] - Get a single entry
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!isValidObjectId(params.id)) {
            return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 })
        }

        await connectDB()
        const entry = await Entry.findById(params.id).exec()

        if (!entry) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 })
        }

        console.log(`[API] Retrieved entry: ${entry.title}`)
        return NextResponse.json(entry)
    } catch (error) {
        console.error("[API] Error in entries/[id]:", error)
        return NextResponse.json(
            {
                error: "Failed to fetch entry",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// PUT /api/entries/[id] - Update an entry
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!isValidObjectId(params.id)) {
            return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 })
        }

        const body = await request.json()
        await connectDB()

        // If status is being updated to approved, calculate confidence
        if (body.status === "approved") {
            const entry = await Entry.findById(params.id)
            if (!entry) {
                return NextResponse.json({ error: "Entry not found" }, { status: 404 })
            }
            body.approvedAt = new Date()
            body.confidence = calculateConfidence(entry)
        }

        const updatedEntry = await Entry.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true }
        ).exec()

        if (!updatedEntry) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 })
        }

        // If entry was approved, cross-reference it
        if (body.status === "approved") {
            try {
                const match = crossReference(updatedEntry)
                if (match) {
                    await updateUserRoadmap(updatedEntry, match)
                    console.log(`[API] Cross-referenced entry: ${updatedEntry.title}`)
                }
            } catch (error) {
                console.error(`[API] Error cross-referencing entry ${params.id}:`, error)
                // Don't fail the request if cross-referencing fails
            }
        }

        console.log(`[API] Updated entry: ${updatedEntry.title}`)
        return NextResponse.json(updatedEntry)
    } catch (error) {
        console.error("[API] Error in entries/[id]:", error)
        return NextResponse.json(
            {
                error: "Failed to update entry",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// DELETE /api/entries/[id] - Delete an entry
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!isValidObjectId(params.id)) {
            return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 })
        }

        await connectDB()
        const deletedEntry = await Entry.findByIdAndDelete(params.id).exec()

        if (!deletedEntry) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 })
        }

        console.log(`[API] Deleted entry: ${deletedEntry.title}`)
        return NextResponse.json({ message: "Entry deleted successfully" })
    } catch (error) {
        console.error("[API] Error in entries/[id]:", error)
        return NextResponse.json(
            {
                error: "Failed to delete entry",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
