import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { type IEntry, Entry } from "@/models/entry"
import { calculateConfidence } from "@/lib/roadmap"
import { processWithSpacy } from "@/lib/spacy"
import { DateTime } from "luxon"

// Helper function to parse duration string to seconds
function parseDuration(duration: string | undefined): number {
    if (!duration) return 0
    const match = duration.match(/(\d+):(\d+):(\d+)/)
    if (!match) return 0
    const [, hours, minutes, seconds] = match
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
}

// POST /api/entries/submit - Process raw history from Chrome extension
export async function POST(request: NextRequest) {
    try {
        console.log("[API] Processing history submission")
        console.log("[API] Request headers:", Object.fromEntries(request.headers.entries()))

        const body = await request.json()
        console.log("[API] Request body:", JSON.stringify(body, null, 2))
        const { startTime, stopTime, history } = body

        if (!startTime || !stopTime || !history || !Array.isArray(history)) {
            console.error("[API] Missing required fields:", { startTime, stopTime, historyLength: history?.length })
            return NextResponse.json(
                {
                    error: "Invalid request body",
                    details: "Missing required fields or invalid format",
                },
                { status: 400 }
            )
        }

        await connectDB()
        console.log("[API] Connected to database")

        // Process entries in batches of 10
        const batchSize = 10
        const batches = []
        for (let i = 0; i < history.length; i += batchSize) {
            batches.push(history.slice(i, i + batchSize))
        }

        console.log(`[API] Processing ${history.length} entries in ${batches.length} batches`)

            const batchResults = await Promise.allSettled(
            batches.map(async (batch) => {
                try {
                    // Process each item in the batch
                    const processedEntries = await Promise.all(
                batch.map(async (item) => {
                    try {
                        // Skip if entry already exists
                        const existingEntry = await Entry.findOne({
                            url: item.url,
                            timestamp: {
                                $gte: DateTime.fromISO(startTime).startOf('day').toJSDate(),
                                $lte: DateTime.fromISO(stopTime).endOf('day').toJSDate(),
                            },
                        })

                        if (existingEntry) {
                            console.log(`[API] Skipping existing entry: ${item.url}`)
                            return null
                        }

                        // Process with spaCy for tagging and classification
                        console.log(`[API] Processing with spaCy: ${item.title}`)
                        const spacyResult = await processWithSpacy(item.title, item.url)

                                // Skip if not learning content
                                if (!spacyResult.isLearningContent) {
                                    console.log(`[API] Skipping non-learning content: ${item.title}`)
                                    return null
                                }

                                // Create new entry
                                const entry: Partial<IEntry> = {
                            url: item.url,
                            title: item.title,
                                    timestamp: new Date(item.timestamp),
                                    visitTime: item.visitTime || 0,
                            tags: spacyResult.tags,
                            keywords: spacyResult.keywords,
                            primaryTopic: spacyResult.primaryTopic,
                                    isVideo: spacyResult.isVideo,
                                    videoLength: item.videoLength || 0,
                                    watchedLength: item.watchedLength || 0,
                            status: "pending",
                            source: "chrome_extension",
                                    confidence: calculateConfidence({
                                        ...item,
                                        tags: spacyResult.tags,
                                        keywords: spacyResult.keywords,
                                        primaryTopic: spacyResult.primaryTopic,
                                        isVideo: spacyResult.isVideo,
                                        status: "pending",
                                    } as IEntry),
                                }

                                const newEntry = await Entry.create(entry)
                                console.log(`[API] Created entry: ${newEntry.title}`)
                                return newEntry
                    } catch (error) {
                                console.error(`[API] Error processing entry: ${item.url}`, error)
                                return null
                    }
                })
            )

                    return processedEntries.filter(Boolean)
                } catch (error) {
                    console.error("[API] Error processing batch:", error)
                    return []
                }
            })
        )

        // Count successful entries
        const successfulEntries = batchResults
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => (result as PromiseFulfilledResult<any[]>).value)
            .filter(Boolean)

        console.log(`[API] Successfully processed ${successfulEntries.length} entries`)

        return NextResponse.json({
            success: true,
            processedCount: successfulEntries.length,
            totalCount: history.length,
        })
    } catch (error) {
        console.error("[API] Error in entries/submit:", error)
        return NextResponse.json(
            {
                error: "Failed to process history",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}
