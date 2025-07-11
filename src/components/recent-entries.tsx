import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDuration } from "@/lib/utils"
import { Clock, Calendar, ExternalLink, ArrowRight } from "lucide-react"
import { DateTime } from "luxon"
import { type Entry } from "@/types/entry"

interface RecentEntriesProps {
    entries: Entry[]
}

export function RecentEntries({ entries }: RecentEntriesProps) {
    if (!entries || entries.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Recent Entries</CardTitle>
                    <CardDescription>You haven't tracked any learning activities yet</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Install the Chrome extension to start tracking your learning progress</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {entries.slice(0, 6).map((entry: Entry) => (
                    <Card key={entry._id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start gap-2">
                                <Link href={`/entries/${entry._id}`} className="hover:underline flex-1 min-w-0">
                                    <CardTitle className="text-lg truncate">{entry.title}</CardTitle>
                                </Link>
                                <Badge
                                    variant={
                                        entry.status === "approved" ? "default" : entry.status === "pending" ? "outline" : "destructive"
                                    }
                                    className="flex-shrink-0"
                                >
                                    {entry.status}
                                </Badge>
                            </div>
                            <CardDescription className="break-words">
                                <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start hover:underline text-blue-600"
                                    title={entry.url}
                                >
                                    <span className="break-all">{entry.url}</span>
                                    <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0 mt-1" />
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 flex-grow">
                            <div className="flex flex-wrap gap-1 mb-2">
                                {entry.tags.slice(0, 3).map((tag: string) => (
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
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                    <Calendar className="mr-1 h-4 w-4" />
                                    {formatDate(entry.timestamp.toString())}
                                </div>
                                {entry.isVideo && (
                                    <div className="flex items-center">
                                        <Clock className="mr-1 h-4 w-4" />
                                        {formatDuration(entry.watchedLength)} / {formatDuration(entry.videoLength)}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/entries/${entry._id}`} className="w-full">
                                <Button variant="outline" className="w-full gap-2">
                                    View Details <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center">
                <Link href="/entries">
                    <Button variant="outline">
                        View All Entries <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
