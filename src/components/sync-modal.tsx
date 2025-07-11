import { useState } from "react"
import { DateTime } from "luxon"

interface SyncModalProps {
    isOpen: boolean
    onClose: () => void
    onSync: (startTime: string, endTime: string) => Promise<void>
    status: "idle" | "in-progress" | "completed" | "error"
    error?: string
}

export function SyncModal({ isOpen, onClose, onSync, status, error }: SyncModalProps) {
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!startTime || !endTime) return

        const start = DateTime.fromISO(startTime)
        const end = DateTime.fromISO(endTime)

        if (start >= end) {
            alert("Start time must be before end time")
            return
        }

        await onSync(startTime, endTime)
    }

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                width: "400px",
                maxWidth: "90%"
            }}>
                <h2 style={{ marginBottom: "20px" }}>Sync with Extension</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px" }}>Start Time</label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc"
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px" }}>End Time</label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc"
                            }}
                            required
                        />
                    </div>

                    {status === "in-progress" && (
                        <div style={{ marginBottom: "15px", color: "#666" }}>
                            Syncing history entries...
                        </div>
                    )}

                    {status === "completed" && (
                        <div style={{ marginBottom: "15px", color: "green" }}>
                            Sync completed successfully!
                        </div>
                    )}

                    {status === "error" && (
                        <div style={{ marginBottom: "15px", color: "red" }}>
                            {error || "An error occurred during sync"}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                backgroundColor: "white",
                                cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === "in-progress"}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: status === "in-progress" ? "#ccc" : "#007bff",
                                color: "white",
                                cursor: status === "in-progress" ? "not-allowed" : "pointer"
                            }}
                        >
                            {status === "in-progress" ? "Syncing..." : "Start Sync"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 