import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Entry } from "@/models/entry"

// GET /api/entries - List approved entries with filtering and pagination
export async function GET(request: NextRequest) {
    try {
        console.log("[API] Fetching entries list")

        const { searchParams } = new URL(request.url)
        const page = Number.parseInt(searchParams.get("page") || "1")
        const limit = Number.parseInt(searchParams.get("limit") || "10")
        const status = searchParams.get("status") || "approved"
        const search = searchParams.get("search") || ""
        const sort = searchParams.get("sort") || "newest"
        const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []
        const excludeId = searchParams.get("excludeId")
        const dateFrom = searchParams.get("dateFrom")
        const dateTo = searchParams.get("dateTo")

        await connectDB()

        // Build query
        const query: any = {}

        if (status !== "all") {
            query.status = status
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } },
                { primaryTopic: { $regex: search, $options: "i" } },
            ]
        }

        if (tags.length > 0) {
            query.tags = { $in: tags }
        }

        if (excludeId) {
            query._id = { $ne: excludeId }
        }

        if (dateFrom || dateTo) {
            query.timestamp = {}
            if (dateFrom) query.timestamp.$gte = new Date(dateFrom)
            if (dateTo) query.timestamp.$lte = new Date(dateTo)
        }

        // Build sort options
        let sortOptions: any = {}
        switch (sort) {
            case "oldest":
                sortOptions = { timestamp: 1 }
                break
            case "title":
                sortOptions = { title: 1 }
                break
            case "confidence":
                sortOptions = { confidence: -1 }
                break
            case "newest":
            default:
                sortOptions = { timestamp: -1 }
                break
        }

        // Execute query with pagination
        const skip = (page - 1) * limit
        const [entries, totalCount] = await Promise.all([
            Entry.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Entry.countDocuments(query).exec(),
        ])

        const totalPages = Math.ceil(totalCount / limit)
        console.log(`[API] Found ${entries.length} entries (Page ${page} of ${totalPages})`)

        return NextResponse.json({
            entries,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            filters: {
                status,
                search,
                sort,
                tags,
                dateFrom,
                dateTo,
            },
        })
    } catch (error) {
        console.error("[API] Error in entries:", error)
        return NextResponse.json(
            {
                error: "Failed to fetch entries",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
