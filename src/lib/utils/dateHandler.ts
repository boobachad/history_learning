import { DateTime, Duration } from "luxon"

/**
 * Validates if a stop time is after a start time.
 * @param startTimeISO String in ISO 8601 format (e.g., "2025-06-10T10:00:00").
 * @param stopTimeISO String in ISO 8601 format.
 * @returns An object indicating validity and an error message if invalid.
 */
export function validateTimeRange(startTimeISO: string, stopTimeISO: string): { isValid: boolean; error?: string } {
    const start = DateTime.fromISO(startTimeISO)
    const stop = DateTime.fromISO(stopTimeISO)

    if (!start.isValid) {
        console.error("[DateHandler] Invalid startTimeISO:", start.invalidExplanation)
        return { isValid: false, error: "Invalid start time format" }
    }
    if (!stop.isValid) {
        console.error("[DateHandler] Invalid stopTimeISO:", stop.invalidExplanation)
        return { isValid: false, error: "Invalid stop time format" }
    }

    if (stop <= start) {
        return { isValid: false, error: "Stop time must be after start time" }
    }

    return { isValid: true }
}

/**
 * Parses a duration string (MM:SS or HH:MM:SS) into total seconds.
 * @param durationString The duration string (e.g., "10:30", "01:05:00").
 * @returns Total seconds, or 0 if parsing fails.
 */
export function parseDuration(durationString: string | number | undefined | null): number {
    if (typeof durationString === "number") {
        return durationString // Already in seconds
    }
    if (!durationString || typeof durationString !== "string") {
        return 0
    }

    const parts = durationString.split(":").map(Number)
    let totalSeconds = 0

    if (parts.length === 2) {
        // MM:SS format
        totalSeconds = parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
        // HH:MM:SS format
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else {
        console.warn(`[DateHandler] Could not parse duration string: "${durationString}"`)
        return 0
    }

    return isNaN(totalSeconds) ? 0 : totalSeconds
}

/**
 * Formats total seconds into a MM:SS or HH:MM:SS string.
 * @param totalSeconds The total duration in seconds.
 * @returns Formatted duration string (e.g., "01:30", "01:05:30").
 */
export function formatDurationToMMSS(totalSeconds: number): string {
    if (typeof totalSeconds !== "number" || isNaN(totalSeconds) || totalSeconds < 0) {
        return "00:00"
    }

    const duration = Duration.fromObject({ seconds: totalSeconds })
    const hours = Math.floor(duration.as("hours"))
    const minutes = duration.minutes % 60 // Get remaining minutes after extracting hours
    const seconds = duration.seconds % 60 // Get remaining seconds after extracting minutes

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(Math.floor(seconds)).padStart(2, "0")}`
    } else {
        return `${String(Math.floor(minutes)).padStart(2, "0")}:${String(Math.floor(seconds)).padStart(2, "0")}`
    }
}

/**
 * Converts a date string or Date object to a UTC Date object.
 * @param dateInput The date string or Date object.
 * @returns A Date object representing the UTC time.
 */
export function convertToUTC(dateInput: string | Date): Date {
    let dateTime: DateTime
    if (typeof dateInput === "string") {
        dateTime = DateTime.fromISO(dateInput, { setZone: true }) // Assume input is local or has zone info
    } else if (dateInput instanceof Date) {
        dateTime = DateTime.fromJSDate(dateInput, { zone: 'utc' })
    } else {
        console.warn("[DateHandler] Invalid date input for convertToUTC:", dateInput)
        return new Date() // Return current UTC date as fallback
    }

    if (!dateTime.isValid) {
        console.error("[DateHandler] Invalid DateTime object:", dateTime.invalidExplanation)
        return new Date() // Return current UTC date as fallback
    }

    const utcDate = dateTime.toUTC().toJSDate()
    console.log(`[DateHandler] Parsed: ${dateTime.toISO()} -> UTC: ${utcDate.toISOString()}`)
    return utcDate
}
