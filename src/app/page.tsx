"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RoadmapView } from "@/components/roadmap-view";
import { RecentEntries } from "@/components/recent-entries";
import { Stats } from "@/components/stats";
import { toast } from "sonner";
import { fetchRoadmap, fetchRecentEntries, fetchStats, updateRoadmapOrder, updateSubtopicOrder } from "@/lib/api";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { type Entry } from "@/types/entry";
import { SyncModal } from "@/components/sync-modal";
import { type IUserRoadmapTopic } from "@/models/roadmap";
import { DropResult } from "@hello-pangea/dnd";

// Define types for the data
interface StatsData {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

// Extension ID from chrome://extensions
const EXTENSION_ID = "gdainjmbpilaoiinccfnbfgofpchibkl";

// Check if Chrome extension is available
function isChromeExtensionAvailable(): boolean {
    return (
        typeof chrome !== "undefined" &&
        typeof chrome.runtime !== "undefined" &&
        typeof chrome.runtime.sendMessage === "function"
    );
}

export default function Dashboard() {
    const [roadmap, setRoadmap] = useState<IUserRoadmapTopic[] | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [stats, setStats] = useState<StatsData>({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [syncStatus, setSyncStatus] = useState<"idle" | "in-progress" | "completed" | "error">("idle");
    const [syncError, setSyncError] = useState<string>();
    const [isCrossReferencing, setIsCrossReferencing] = useState(false);
    const [crossReferenceError, setCrossReferenceError] = useState<string>();

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true);
                const [roadmapData, entriesData, statsData] = await Promise.all([
                    fetchRoadmap(),
                    fetchRecentEntries(),
                    fetchStats(),
                ]);

                setRoadmap(roadmapData);
                setEntries(entriesData);
                setStats(statsData);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
                toast.error("Error loading data", {
                    description: "Please try refreshing the page",
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    async function handleSync(startTime: string, endTime: string) {
        try {
            if (!isChromeExtensionAvailable()) {
                setSyncStatus("error");
                setSyncError("Chrome extension is not available. Please make sure the extension is installed and enabled.");
                return;
            }

            setSyncStatus("in-progress");
            setSyncError(undefined);

            const response = await chrome.runtime.sendMessage(EXTENSION_ID, {
                type: "PROCESS_HISTORY",
                startTime,
                endTime,
            });

            if (!response.success) {
                throw new Error(response.error || "Failed to process history");
            }

            setSyncStatus("completed");
            setTimeout(() => {
                setSyncStatus("idle");
            }, 2000);

            return response;
        } catch (error) {
            console.error("Sync failed:", error);
            setSyncStatus("error");
            setSyncError(error instanceof Error ? error.message : "Failed to sync with extension");
            throw error;
        }
    }

    async function handleCrossReference() {
        try {
            setIsCrossReferencing(true);
            setCrossReferenceError(undefined);

            const response = await fetch("/api/entries/cross-reference", {
                method: "POST",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || "Failed to cross-reference entries");
            }

            const result = await response.json();
            console.log("Cross-reference result:", result);

            toast.success(`Cross-referenced ${result.processedCount} entries`);
        } catch (error) {
            console.error("Cross-reference failed:", error);
            setCrossReferenceError(error instanceof Error ? error.message : "Failed to cross-reference entries");
            toast.error("Failed to cross-reference entries");
        } finally {
            setIsCrossReferencing(false);
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-8">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Home</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Learning Path Analyzer</h1>
                    <p className="text-muted-foreground">Track and visualize your learning progress</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsSyncModalOpen(true)}>Sync with Extension</Button>
                    <Button onClick={handleCrossReference} disabled={isCrossReferencing} variant="outline">
                        {isCrossReferencing ? "Cross-referencing..." : "Cross-reference Entries"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Total Entries</CardTitle>
                        <CardDescription>All tracked learning activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                        <Progress value={(stats.approved / stats.total) * 100} className="mt-2" />
                    </CardContent>
                    <CardFooter className="text-sm text-muted-foreground">
                        {stats.approved} approved, {stats.pending} pending
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Learning Time</CardTitle>
                        <CardDescription>Total time spent learning</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">24h 35m</div>
                        <Progress value={65} className="mt-2" />
                    </CardContent>
                    <CardFooter className="text-sm text-muted-foreground">+2h 15m from last week</CardFooter>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Topics Covered</CardTitle>
                        <CardDescription>Unique learning topics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">12</div>
                        <Progress value={75} className="mt-2" />
                    </CardContent>
                    <CardFooter className="text-sm text-muted-foreground">3 new topics this week</CardFooter>
                </Card>
            </div>

            <Tabs defaultValue="roadmap" className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-3">
                    <TabsTrigger value="roadmap">Learning Roadmap</TabsTrigger>
                    <TabsTrigger value="recent">Recent Entries</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>
                <TabsContent value="roadmap" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        roadmap && (
                            <div className="mt-8">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle>Learning Roadmap</CardTitle>
                                        <CardDescription>Your personalized learning path</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <RoadmapView
                                            topics={roadmap}
                                            onReorder={async (result: DropResult, newTopics: IUserRoadmapTopic[]) => {
                                                if (!result.destination) return;
                                                try {
                                                    const [type, id] = result.draggableId.split("-");
                                                    if (type === "topic") {
                                                        // Store current state for rollback
                                                        const previousTopics = [...roadmap];

                                                        // Optimistically update UI
                                                        setRoadmap(newTopics);

                                                        try {
                                                            await updateRoadmapOrder(id, result.destination.index, roadmap);
                                                            toast.success("Topic order updated");
                                                        } catch (error) {
                                                            // Rollback on error
                                                            setRoadmap(previousTopics);
                                                            throw error;
                                                        }
                                                    } else if (type === "subtopic") {
                                                        const [topicId, subtopicId] = id.split("-");
                                                        if (!topicId || !subtopicId) {
                                                            throw new Error("Invalid subtopic ID format");
                                                        }

                                                        // Store current state for rollback
                                                        const previousTopics = [...roadmap];

                                                        // Optimistically update UI
                                                        setRoadmap(newTopics);

                                                        try {
                                                            await updateSubtopicOrder(topicId, subtopicId, result.destination.index, roadmap);
                                                            toast.success("Subtopic order updated");
                                                        } catch (error) {
                                                            // Rollback on error
                                                            setRoadmap(previousTopics);
                                                            throw error;
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.error("Failed to update order:", error);
                                                    toast.error(error instanceof Error ? error.message : "Failed to update order");
                                                }
                                            }}
                                            onUpdate={(newTopics) => {
                                                setRoadmap(newTopics);
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    )}
                </TabsContent>
                <TabsContent value="recent" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <RecentEntries entries={entries} />
                    )}
                </TabsContent>
                <TabsContent value="stats" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <Stats stats={stats} />
                    )}
                </TabsContent>
            </Tabs>

            <SyncModal
                isOpen={isSyncModalOpen}
                onClose={() => {
                    setIsSyncModalOpen(false);
                    setSyncStatus("idle");
                    setSyncError(undefined);
                }}
                onSync={handleSync}
                status={syncStatus}
                error={syncError}
            />
        </div>
    );
}