import mongoose from "mongoose"

interface MongooseCache {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
}

declare global {
    var mongoose: MongooseCache
}

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env")
}

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        }

        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then((mongoose) => {
                return mongoose
            })
    }

    try {
        cached.conn = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.conn
}

export async function disconnectDB() {
    try {
        await mongoose.disconnect()
        console.log("[DB] Disconnected from MongoDB")
    } catch (error) {
        console.error("[DB] Error disconnecting from MongoDB:", error)
    }
}

export async function getDBStats() {
    try {
        const db = mongoose.connection.db
        if (!db) {
            throw new Error("Database connection not established")
        }

        const adminDb = db.admin()
        const serverStatus = await adminDb.serverStatus()

        return {
            status: "ok",
            stats: {
                connections: serverStatus.connections,
                network: serverStatus.network,
                opcounters: serverStatus.opcounters,
                mem: serverStatus.mem,
                uptime: serverStatus.uptime,
            },
        }
    } catch (error) {
        console.error("[DB] Error getting database stats:", error)
        return {
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        }
    }
}

export async function createIndexes() {
    try {
        const db = mongoose.connection.db
        if (!db) {
            throw new Error("Database connection not established")
        }

        // Create indexes for entries collection
        await db.collection("entries").createIndex(
            { url: 1, timestamp: 1 },
            { unique: true }
        )
        await db.collection("entries").createIndex({ status: 1 })
        await db.collection("entries").createIndex({ tags: 1 })
        await db.collection("entries").createIndex({ timestamp: 1 })
        await db.collection("entries").createIndex({ primaryTopic: 1 })

        console.log("[DB] Indexes created successfully")
    } catch (error) {
        console.error("[DB] Error creating indexes:", error)
        throw error
    }
}

export async function getCollectionStats() {
    try {
        const db = mongoose.connection.db
        if (!db) {
            throw new Error("Database connection not established")
        }

        const [entriesCount, roadmapsCount] = await Promise.all([
            db.collection("entries").countDocuments(),
            db.collection("user_roadmaps").countDocuments(),
        ])

        const dbStats = await db.stats()

        return {
            collections: {
                entries: entriesCount,
                user_roadmaps: roadmapsCount,
            },
            dbStats: {
                collections: dbStats.collections,
                indexes: dbStats.indexes,
                objects: dbStats.objects,
                avgObjSize: dbStats.avgObjSize,
                dataSize: dbStats.dataSize,
                storageSize: dbStats.storageSize,
                indexesSize: dbStats.indexesSize,
            },
        }
    } catch (error) {
        console.error("[DB] Error getting collection stats:", error)
        throw error
    }
}

// Type augmentation for global mongoose cache
declare global {
    // var mongoose: { // Removed redeclaration of mongoose
    var mongooseCache: {
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null
    }
}
