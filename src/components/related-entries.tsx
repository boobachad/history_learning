import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDuration } from "@/lib/utils"
import { Clock, Calendar, ExternalLink, ArrowRight } from "lucide-react"
import { DateTime } from "luxon"
import { type RelatedEntry } from "@/types/entry"

interface RelatedEntriesProps {
    entries: RelatedEntry[]
}

export function RelatedEntries({ entries }: RelatedEntriesProps) {
    if (!entries || entries.length === 0) {
        return <p className="text-muted-foreground">No related entries found</p>
    }

    return (
        <div className="space-y-3">
            {entries.map((entry: RelatedEntry) => (
                <div key={entry._id} className="border-b pb-3 last:border-0">
                    <Link href={`/entries/${entry._id}`} className="font-medium hover:underline block">
                        {entry.title as string}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.timestamp.toString())}
                        <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:underline text-blue-600 ml-auto"
                        >
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
