"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GripVertical, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { updateRoadmapOrder, updateSubtopicOrder, markTopicAsCompleted } from "@/lib/api";
import { toast } from "sonner";
import { type IUserRoadmapTopic, type IUserRoadmapSubtopic } from "@/models/roadmap";
import Link from "next/link";
import { DateTime } from "luxon";

interface RoadmapViewProps {
    topics: IUserRoadmapTopic[];
    onReorder?: (result: DropResult, newTopics: IUserRoadmapTopic[]) => void;
    onUpdate?: (newTopics: IUserRoadmapTopic[]) => void;
}

export function RoadmapView({ topics, onReorder, onUpdate }: RoadmapViewProps) {
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [isReordering, setIsReordering] = useState(false);
    const [roadmap, setRoadmap] = useState(topics);

    // Preserve expanded topics when topics change, but only if they still exist
    useEffect(() => {
        setExpandedTopics(prev => {
            const next = new Set<string>();
            prev.forEach(topicId => {
                if (topics.some(t => t.id === topicId)) {
                    next.add(topicId);
                }
            });
            return next;
        });
    }, [topics]);

    // Update local state when topics prop changes
    useEffect(() => {
        setRoadmap(topics);
    }, [topics]);

    const toggleTopic = (topicId: string) => {
        setExpandedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(topicId)) {
                next.delete(topicId);
            } else {
                next.add(topicId);
            }
            return next;
        });
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination || !onReorder || isReordering) return;

        const { source, destination, draggableId, type } = result;

        try {
            setIsReordering(true);

            // Extract IDs properly
            let topicId: string;
            let subtopicId: string | undefined;

            if (type === "topic") {
                // Extract topic ID from draggableId (format: "topic-{id}")
                const match = draggableId.match(/^topic-(.+)$/);
                if (!match) {
                    throw new Error(`Invalid topic ID format: ${draggableId}`);
                }
                topicId = match[1];
            } else if (type === "subtopic") {
                // Extract topic and subtopic IDs from draggableId (format: "subtopic-{topicId}-{subtopicId}")
                const match = draggableId.match(/^subtopic-(.+?)-(.+)$/);
                if (!match) {
                    throw new Error(`Invalid subtopic ID format: ${draggableId}`);
                }
                [, topicId, subtopicId] = match;
            } else {
                throw new Error(`Invalid drag type: ${type}`);
            }

            // Create a copy of the current topics for reordering
            const reorderedTopics = [...topics];

            if (type === "topic") {
                const topicIndex = reorderedTopics.findIndex((t) => t.id === topicId);
                if (topicIndex === -1) {
                    throw new Error(`Topic with ID ${topicId} not found`);
                }

                const [movedTopic] = reorderedTopics.splice(topicIndex, 1);
                reorderedTopics.splice(destination.index, 0, movedTopic);

                // Update the order in the database
                await updateRoadmapOrder(topicId, destination.index, reorderedTopics);

                // Update the UI
                onReorder(result, reorderedTopics);
                toast.success("Topic order updated");
            } else if (type === "subtopic" && subtopicId) {
                const topicIndex = reorderedTopics.findIndex((t) => t.id === topicId);
                if (topicIndex === -1) {
                    throw new Error(`Topic with ID ${topicId} not found`);
                }

                const subtopics = [...reorderedTopics[topicIndex].subtopics];
                const subtopicIndex = subtopics.findIndex((s) => s.id === subtopicId);
                if (subtopicIndex === -1) {
                    throw new Error(`Subtopic with ID ${subtopicId} not found`);
                }

                const [movedSubtopic] = subtopics.splice(subtopicIndex, 1);
                subtopics.splice(destination.index, 0, movedSubtopic);
                reorderedTopics[topicIndex].subtopics = subtopics;

                // Update the order in the database
                await updateSubtopicOrder(topicId, subtopicId, destination.index, reorderedTopics);

                // Update the UI
                onReorder(result, reorderedTopics);
                toast.success("Subtopic order updated");
            }
        } catch (error) {
            console.error("[Roadmap] Error updating order:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update order");
        } finally {
            setIsReordering(false);
        }
    };

    const handleMarkAsCompleted = async (topicId: string, subtopicId?: string) => {
        try {
            const response = await fetch(`/api/roadmap/${topicId}/complete${subtopicId ? `?subtopicId=${subtopicId}` : ''}`, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to mark as completed');
            }

            const data = await response.json();

            // Update the local state with the new data
            const updatedTopics = roadmap.map(topic => {
                if (topic.id === topicId) {
                    if (subtopicId) {
                        // Update subtopic
                        return {
                            ...topic,
                            subtopics: topic.subtopics.map(subtopic =>
                                subtopic.id === subtopicId
                                    ? { ...subtopic, progress: 100, status: "completed" as const }
                                    : subtopic
                            )
                        };
                    } else {
                        // Update topic
                        return { ...topic, progress: 100, status: "completed" as const };
                    }
                }
                return topic;
            });

            // Update local state
            setRoadmap(updatedTopics);

            // Notify parent component of the update
            if (onUpdate) {
                onUpdate(updatedTopics);
            }

            toast.success('Marked as completed successfully');
        } catch (error) {
            console.error('Error marking as completed:', error);
            toast.error('Failed to mark as completed');
        }
    };

    const fetchRoadmap = async () => {
        try {
            const response = await fetch('/api/roadmap');
            if (!response.ok) {
                throw new Error('Failed to fetch roadmap');
            }
            const data = await response.json();
            setRoadmap(data.roadmap.topics);
        } catch (error) {
            console.error('Error fetching roadmap:', error);
            toast.error('Failed to fetch roadmap');
        }
    };

    // Validate and filter topics
    const validTopics = topics?.filter((topic): topic is IUserRoadmapTopic => {
        if (!topic?.id) {
            console.warn("[Roadmap] Topic missing ID:", topic);
            return false;
        }
        return true;
    }) || [];

    // Check if topics exist
    if (!validTopics.length) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">No Roadmap Data</h3>
                    <p className="text-sm text-muted-foreground">
                        Your learning roadmap will appear here once you have some entries
                    </p>
                </CardHeader>
            </Card>
        );
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="topics" type="topic">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {validTopics.map((topic, index) => {
                            const renderTopic = (provided: any) => (
                                <Card ref={provided.innerRef} {...provided.draggableProps} className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div {...provided.dragHandleProps}>
                                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => toggleTopic(topic.id)}
                                                >
                                                    {expandedTopics.has(topic.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <h3 className="font-semibold">{topic.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={topic.status === "completed" ? "default" : "secondary"}>
                                                    {topic.status === "completed" ? "Completed" : "In Progress"}
                                                </Badge>
                                                {topic.status === "in_progress" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleMarkAsCompleted(topic.id)}
                                                        disabled={topic.subtopics.some(st => st.status === "in_progress")}
                                                    >
                                                        Mark as Completed
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {expandedTopics.has(topic.id) && (
                                        <CardContent>
                                            <Droppable droppableId={`subtopics-${topic.id}`} type="subtopic">
                                                {(provided) => (
                                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                                        {topic.subtopics
                                                            ?.filter(
                                                                (subtopic): subtopic is IUserRoadmapSubtopic => {
                                                                    if (!subtopic?.id) {
                                                                        console.warn("[Roadmap] Subtopic missing ID:", subtopic);
                                                                        return false;
                                                                    }
                                                                    return true;
                                                                }
                                                            )
                                                            .map((subtopic, index) => {
                                                                const renderSubtopic = (provided: any) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className="flex flex-col gap-2 p-2 rounded-lg border bg-card"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                                                <span>{subtopic.name}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant={subtopic.status === "completed" ? "default" : "secondary"}>
                                                                                    {subtopic.status === "completed" ? "Completed" : "In Progress"}
                                                                                </Badge>
                                                                                {subtopic.status === "in_progress" && (
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="sm"
                                                                                        onClick={() => handleMarkAsCompleted(topic.id, subtopic.id)}
                                                                                    >
                                                                                        Mark as Completed
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Show subtopic entries */}
                                                                        {subtopic.entries && subtopic.entries.length > 0 && (
                                                                            <div className="ml-6 space-y-1">
                                                                                {subtopic.entries.map((entry) => (
                                                                                    <div
                                                                                        key={entry.entryId}
                                                                                        className="flex flex-col p-1 rounded border bg-muted/50"
                                                                                    >
                                                                                        <div className="flex items-start justify-between">
                                                                                            <div className="flex flex-col gap-1">
                                                                                                <Link
                                                                                                    href={`/entries/${entry.entryId}`}
                                                                                                    className="text-xs font-medium hover:underline"
                                                                                                >
                                                                                                    {entry.title || `Entry ${entry.entryId}`}
                                                                                                </Link>
                                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                                    <span>
                                                                                                        {entry.createdAt
                                                                                                            ? DateTime.fromISO(entry.createdAt.toString()).toRelative()
                                                                                                            : "Unknown date"}
                                                                                                    </span>
                                                                                                    <span>{entry.url || "No URL"}</span>
                                                                                                </div>
                                                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                                                    {entry.tags?.map((tag) => (
                                                                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                                                                            {tag}
                                                                                                        </Badge>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                            <Link
                                                                                                href={`/entries/${entry.entryId}`}
                                                                                                className="text-xs text-muted-foreground hover:text-foreground"
                                                                                            >
                                                                                                View Details
                                                                                            </Link>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                                return (
                                                                    <Draggable
                                                                        key={`subtopic-${subtopic.id}`}
                                                                        draggableId={`subtopic-${topic.id}-${subtopic.id}`}
                                                                        index={index}
                                                                    >
                                                                        {renderSubtopic}
                                                                    </Draggable>
                                                                );
                                                            })}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                            return (
                                <Draggable key={`topic-${topic.id}`} draggableId={`topic-${topic.id}`} index={index}>
                                    {renderTopic}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}