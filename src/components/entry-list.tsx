import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDuration } from "@/lib/utils"
import { Clock, Calendar, ExternalLink, ArrowRight, Check, X } from "lucide-react"
import { DateTime } from "luxon"
import { type Entry } from "@/types/entry"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateEntry } from "@/lib/api"

interface EntryListProps {
    entries: Entry[]
    onEntryUpdate?: () => void
}

export function EntryList({ entries, onEntryUpdate }: EntryListProps) {
    if (!entries || entries.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Entries Found</CardTitle>
                    <CardDescription>No learning entries match your current filters</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const handleStatusChange = async (entryId: string, newStatus: "approved" | "rejected") => {
        try {
            await updateEntry(entryId, { status: newStatus })
            toast.success(`Entry ${newStatus}`)
            if (onEntryUpdate) {
                onEntryUpdate()
            }
        } catch (error) {
            console.error("Failed to update entry status:", error)
            toast.error("Failed to update entry status")
        }
    }

    return (
        <div className="space-y-4">
            {entries.map((entry: Entry) => (
                <Card key={entry._id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <CardTitle className="text-lg">
                                    <Link href={`/entries/${entry._id}`} className="hover:underline">
                                        {entry.title}
                                    </Link>
                                </CardTitle>
                                <CardDescription className="break-words">
                                    <span className="whitespace-nowrap">{DateTime.fromISO(entry.timestamp.toString()).toRelative()}</span>
                                    <span className="mx-2">•</span>
                                    <a
                                        href={entry.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-start hover:underline text-blue-600"
                                        title={entry.url}
                                    >
                                        <span className="break-all">{entry.url}</span>
                                        <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0 mt-1" />
                                    </a>
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {entry.status === "pending" && (
                                    <div key={`${entry._id}-actions`} className="flex items-center gap-2">
                                        <Button
                                            key={`${entry._id}-approve`}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => handleStatusChange(entry._id, "approved")}
                                        >
                                            <Check className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button
                                            key={`${entry._id}-reject`}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => handleStatusChange(entry._id, "rejected")}
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                )}
                                <Badge
                                    key={`${entry._id}-status`}
                                    variant={
                                        entry.status === "approved"
                                            ? "default"
                                            : entry.status === "rejected"
                                                ? "destructive"
                                                : "outline"
                                    }
                                >
                                    {entry.status}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">{entry.summary}</p>
                            <div className="flex flex-wrap gap-2">
                                {entry.tags.slice(0, 3).map((tag) => (
                                    <Badge key={`${entry._id}-tag-${tag}`} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                                {entry.tags.length > 3 && (
                                    <Badge key={`${entry._id}-more-tags`} variant="outline" className="text-xs">
                                        +{entry.tags.length - 3} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                <Calendar className="mr-1 h-4 w-4" />
                                {formatDate(entry.timestamp.toString())}
                            </div>
                            {entry.videoLength > 0 && (
                                <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" />
                                    {formatDuration(entry.watchedLength)} / {formatDuration(entry.videoLength)}
                                </div>
                            )}
                        </div>
                        <Link href={`/entries/${entry._id}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                View Details <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
