import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { type IEntry, Entry } from "@/models/entry"
import { isValidObjectId } from "mongoose"

// PUT /api/entries/pending/:id - Edit pending entry
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!isValidObjectId(params.id)) {
            return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 })
        }

        const data = await request.json()
        await connectDB()

        const entry = await Entry.findById(params.id)
        if (!entry) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 })
        }

        // Update only allowed fields
        const allowedFields = ["title", "tags", "keywords", "primaryTopic", "summary", "notes"]
        const updates: Partial<IEntry> = {}
        for (const field of allowedFields) {
            if (field in data) {
                updates[field as keyof IEntry] = data[field]
            }
        }

        const updatedEntry = await Entry.findByIdAndUpdate(params.id, updates, { new: true })
        return NextResponse.json(updatedEntry)
    } catch (error) {
        console.error("[PendingEntry] Error:", error)
        return NextResponse.json(
            { error: "Failed to update pending entry", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}

// DELETE /api/entries/pending/:id - Delete pending entry
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!isValidObjectId(params.id)) {
            return NextResponse.json({ error: "Invalid entry ID" }, { status: 400 })
        }

        await connectDB()

        const deletedEntry = await Entry.findByIdAndDelete(params.id)
        if (!deletedEntry) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PendingEntry] Error:", error)
        return NextResponse.json(
            { error: "Failed to delete entry", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
