"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { fetchEntry, updateEntry } from "@/lib/api"
import { toast } from "sonner"
import { formatDate, formatDuration } from "@/lib/utils/ui"
import { ArrowLeft, Clock, ExternalLink, Tag, Calendar, BarChart2 } from "lucide-react"
import { EntryEditor } from "@/components/entry-editor"
import { RelatedEntries } from "@/components/related-entries"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { type Entry, type RelatedEntry } from "@/types/entry"

export default function EntryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [entry, setEntry] = useState<Entry | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [relatedEntries, setRelatedEntries] = useState<RelatedEntry[]>([])

    useEffect(() => {
        const loadEntry = async () => {
            try {
                setIsLoading(true)
                const entryData = await fetchEntry(params.id as string)
                setEntry(entryData)

                // Fetch related entries based on tags
                if (entryData.tags && entryData.tags.length) {
                    const related = await fetchRelatedEntries(entryData.tags, entryData._id)
                    setRelatedEntries(related)
                }
            } catch (error) {
                console.error("Failed to load entry:", error)
                toast.error("The entry could not be found or accessed")
                router.push("/entries")
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            loadEntry()
        }
    }, [params.id, router])

    const handleUpdate = async (updatedData: Partial<Entry>) => {
        if (!entry) return
        try {
            // Ensure we're sending all the updated fields
            const dataToUpdate = {
                ...entry,
                ...updatedData,
                _id: entry._id, // Ensure we keep the original ID
            }
            const updated = await updateEntry(entry._id, dataToUpdate)
            setEntry(updated)
            setIsEditing(false)
            toast.success("The entry has been successfully updated")
        } catch (error) {
            console.error("Failed to update entry:", error)
            toast.error("Could not update the entry. Please try again.")
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!entry) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Entry Not Found</CardTitle>
                        <CardDescription>The requested entry could not be found</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => router.push("/entries")}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Entries
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/entries">Entries</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{entry.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => router.push("/entries")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h1 className="text-2xl font-bold tracking-tight">{entry.title}</h1>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{entry.title}</CardTitle>
                                        <CardDescription>
                                            <a
                                                href={entry.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center hover:underline text-blue-600"
                                            >
                                                {entry.url} <ExternalLink className="ml-1 h-3 w-3" />
                                            </a>
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            entry.status === "approved" ? "default" : entry.status === "pending" ? "secondary" : "destructive"
                                        }
                                    >
                                        {entry.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {entry.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground flex items-center">
                                            <Calendar className="mr-1 h-4 w-4" /> Date
                                        </span>
                                        <span>{formatDate(entry.timestamp.toString())}</span>
                                    </div>
                                    {entry.isVideo && (
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground flex items-center">
                                                <Clock className="mr-1 h-4 w-4" /> Duration
                                            </span>
                                            <span>{formatDuration(entry.watchedLength)} / {formatDuration(entry.videoLength)}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground flex items-center">
                                            <Tag className="mr-1 h-4 w-4" /> Topic
                                        </span>
                                        <span>{entry.primaryTopic || "Unclassified"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground flex items-center">
                                            <BarChart2 className="mr-1 h-4 w-4" /> Confidence
                                        </span>
                                        <span>{entry.confidence}%</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                {isEditing ? (
                                    <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>Edit Entry</Button>
                                )}
                            </CardFooter>
                        </Card>

                        <Tabs defaultValue="details">
                            <TabsList>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="roadmap">Roadmap Position</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="mt-4">
                                {isEditing ? (
                                    <EntryEditor
                                        entry={entry}
                                        onSave={handleUpdate}
                                        onCancel={() => setIsEditing(false)}
                                    />
                                ) : (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Learning Details</CardTitle>
                                            <CardDescription>Information extracted from this learning activity</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <h3 className="font-medium">Content Summary</h3>
                                                <p className="text-muted-foreground">{entry.summary || "No summary available"}</p>
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Extracted Keywords</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {entry.keywords?.map((keyword, index) => (
                                                        <Badge key={index} variant="secondary">
                                                            {keyword}
                                                        </Badge>
                                                    )) || "No keywords extracted"}
                                                </div>
                                            </div>
                                            {entry.isVideo && (
                                                <div>
                                                    <h3 className="font-medium">Learning Progress</h3>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="w-full bg-muted rounded-full h-2.5">
                                                            <div
                                                                className="bg-primary h-2.5 rounded-full"
                                                                style={{ width: `${(entry.watchedLength / entry.videoLength) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDuration(entry.watchedLength)} / {formatDuration(entry.videoLength)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                            <TabsContent value="roadmap" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Roadmap Position</CardTitle>
                                        <CardDescription>Where this entry fits in your learning roadmap</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-medium">Topic Path</h3>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <Badge variant="outline">Web Development</Badge>
                                                    <span className="text-muted-foreground">→</span>
                                                    <Badge variant="outline">JavaScript</Badge>
                                                    <span className="text-muted-foreground">→</span>
                                                    <Badge variant="secondary">React</Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Prerequisites</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge variant="outline">HTML</Badge>
                                                    <Badge variant="outline">CSS</Badge>
                                                    <Badge variant="outline">JavaScript Basics</Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-medium">Next Steps</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge variant="outline">React Hooks</Badge>
                                                    <Badge variant="outline">State Management</Badge>
                                                    <Badge variant="outline">React Router</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="history" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Entry History</CardTitle>
                                        <CardDescription>Changes made to this entry</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start border-b pb-2">
                                                <div>
                                                    <p className="font-medium">Created</p>
                                                    <p className="text-sm text-muted-foreground">Entry was created from browser history</p>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {entry.createdAt ? formatDate(entry.createdAt) : "Unknown"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-start border-b pb-2">
                                                <div>
                                                    <p className="font-medium">Status Changed</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Status changed from "pending" to "{entry.status}"
                                                    </p>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {entry.updatedAt ? formatDate(entry.updatedAt) : "Unknown"}
                                                </span>
                                            </div>
                                            {entry.updatedAt && entry.updatedAt !== entry.createdAt ? (
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">Content Updated</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {entry.tags.length > 0 ? `Updated with ${entry.tags.length} tags` : "Content was updated"}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {entry.updatedAt ? formatDate(entry.updatedAt) : "Unknown"}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Learning Impact</CardTitle>
                                <CardDescription>How this entry contributes to your learning</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">Topic Mastery</span>
                                            <span className="text-sm text-muted-foreground">65%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "65%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">Roadmap Progress</span>
                                            <span className="text-sm text-muted-foreground">42%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "42%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">Learning Consistency</span>
                                            <span className="text-sm text-muted-foreground">78%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "78%" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Related Entries</CardTitle>
                                <CardDescription>Other entries with similar topics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RelatedEntries entries={relatedEntries} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

async function fetchRelatedEntries(tags: string[], currentId: string): Promise<RelatedEntry[]> {
    const params = new URLSearchParams({
        tags: tags.join(','),
        excludeId: currentId,
        limit: '3'
    })

    const response = await fetch(`/api/entries?${params}`)
    if (!response.ok) {
        throw new Error('Failed to fetch related entries')
    }
    const data = await response.json()
    return data.entries
}
