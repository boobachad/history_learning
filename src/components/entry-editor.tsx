"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { type Entry } from "@/types/entry"

type EntryEditorEntry = Omit<Entry, "createdAt" | "updatedAt">

interface EntryEditorProps {
    entry: Entry
    onSave: (updatedEntry: Entry) => Promise<void>
    onCancel: () => void
}

export function EntryEditor({ entry, onSave, onCancel }: EntryEditorProps) {
    const [editedEntry, setEditedEntry] = useState<EntryEditorEntry>({
        ...entry,
        _id: entry._id,
    })
    const [newTag, setNewTag] = useState<string>("")

    const handleChange = (field: keyof EntryEditorEntry, value: string | number) => {
        setEditedEntry((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const addTag = () => {
        if (newTag.trim() && !editedEntry.tags.includes(newTag.trim())) {
            setEditedEntry({
                ...editedEntry,
                tags: [...editedEntry.tags, newTag.trim()],
            })
            setNewTag("")
        }
    }

    const removeTag = (tagToRemove: string) => {
        setEditedEntry({
            ...editedEntry,
            tags: editedEntry.tags.filter((tag: string) => tag !== tagToRemove),
        })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSave(editedEntry as Entry)
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Entry</CardTitle>
                    <CardDescription>Update the details of this learning activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">
                            Title
                        </label>
                        <Input
                            id="title"
                            value={editedEntry.title as string}
                            onChange={(e) => handleChange("title" as keyof EntryEditorEntry, e.target.value)}
                            placeholder="Enter title"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="url" className="text-sm font-medium">
                            URL
                        </label>
                        <Input
                            id="url"
                            value={editedEntry.url}
                            onChange={(e) => handleChange("url", e.target.value)}
                            placeholder="Enter URL"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="status" className="text-sm font-medium">
                            Status
                        </label>
                        <Select value={editedEntry.status} onValueChange={(value) => handleChange("status", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="primaryTopic" className="text-sm font-medium">
                            Primary Topic
                        </label>
                        <Input
                            id="primaryTopic"
                            value={editedEntry.primaryTopic || ""}
                            onChange={(e) => handleChange("primaryTopic", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tags" className="text-sm font-medium">
                            Tags
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="tags"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Add a tag"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        addTag()
                                    }
                                }}
                            />
                            <Button type="button" onClick={addTag}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {editedEntry.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="ml-1 hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="summary" className="text-sm font-medium">
                            Summary
                        </label>
                        <Textarea
                            id="summary"
                            value={editedEntry.summary || ""}
                            onChange={(e) => handleChange("summary", e.target.value)}
                            placeholder="Enter summary"
                            />
                    </div>

                    {editedEntry.isVideo && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="videoLength" className="text-sm font-medium">
                                Video Length (MM:SS)
                            </label>
                            <Input
                                id="videoLength"
                                value={editedEntry.videoLength || ""}
                                onChange={(e) => handleChange("videoLength", e.target.value)}
                                placeholder="10:30"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="watchedLength" className="text-sm font-medium">
                                Watched Length (MM:SS)
                            </label>
                            <Input
                                id="watchedLength"
                                value={editedEntry.watchedLength || ""}
                                onChange={(e) => handleChange("watchedLength", e.target.value)}
                                placeholder="08:45"
                            />
                        </div>
                    </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="confidence" className="text-sm font-medium">
                            Confidence Score
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="confidence"
                                type="number"
                                min="0"
                                max="100"
                                value={editedEntry.confidence || 0}
                                onChange={(e) => handleChange("confidence", Number(e.target.value))}
                            />
                            <span>%</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="submit">Save Changes</Button>
                </CardFooter>
            </Card>
        </form>
    )
}
