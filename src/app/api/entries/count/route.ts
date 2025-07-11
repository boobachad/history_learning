import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Entry } from "@/models/entry"

// GET /api/entries/count - Get entry counts and statistics
export async function GET(request: NextRequest) {
    try {
        console.log("[API] Fetching entry counts")

        await connectDB()

        // Get counts for different statuses
        const [totalApproved, totalPending, totalRejected, recentApproved, recentPending] = await Promise.all([
            Entry.countDocuments({ status: "approved" }),
            Entry.countDocuments({ status: "pending" }),
            Entry.countDocuments({ status: "rejected" }),
            Entry.countDocuments({
                status: "approved",
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
            }),
            Entry.countDocuments({
                status: "pending",
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
            }),
        ])

        // Get top tags
        const topTags = await Entry.aggregate([
            { $match: { status: "approved" } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ])

        // Get learning time statistics
        const learningStats = await Entry.aggregate([
            { $match: { status: "approved" } },
            {
                $group: {
                    _id: null,
                    totalWatchTime: { $sum: "$watchedLength" },
                    totalVideoTime: { $sum: "$videoLength" },
                    avgConfidence: { $avg: "$confidence" },
                    entriesCount: { $sum: 1 },
                },
            },
        ])

        return NextResponse.json({
            counts: {
                total: {
                    approved: totalApproved,
                    pending: totalPending,
                    rejected: totalRejected,
                },
                recent: {
                    approved: recentApproved,
                    pending: recentPending,
                },
            },
            topTags: topTags.map((tag) => ({
                name: tag._id,
                count: tag.count,
            })),
            learningStats: learningStats[0]
                ? {
                    totalWatchTime: learningStats[0].totalWatchTime,
                    totalVideoTime: learningStats[0].totalVideoTime,
                    avgConfidence: Math.round(learningStats[0].avgConfidence),
                    entriesCount: learningStats[0].entriesCount,
                }
                : null,
        })
    } catch (error) {
        console.error("[API] Error in entries/count:", error)
        return NextResponse.json(
            {
                error: "Failed to fetch entry counts",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}
