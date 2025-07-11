"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface StatsProps {
    stats: {
        total: number
        pending: number
        approved: number
        rejected: number
    }
}

export function Stats({ stats }: StatsProps) {
    // Sample data for charts
    const weeklyData = [
        { name: "Mon", value: 4 },
        { name: "Tue", value: 3 },
        { name: "Wed", value: 5 },
        { name: "Thu", value: 2 },
        { name: "Fri", value: 6 },
        { name: "Sat", value: 4 },
        { name: "Sun", value: 3 },
    ]

    const topicData = [
        { name: "React", value: 12 },
        { name: "TypeScript", value: 8 },
        { name: "Node.js", value: 6 },
        { name: "MongoDB", value: 4 },
        { name: "GraphQL", value: 3 },
    ]

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Total Entries</CardTitle>
                        <CardDescription>All tracked learning activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                        <Progress value={(stats.approved / stats.total) * 100} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Approved</CardTitle>
                        <CardDescription>Successfully processed entries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.approved}</div>
                        <Progress value={(stats.approved / stats.total) * 100} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Pending</CardTitle>
                        <CardDescription>Entries awaiting processing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.pending}</div>
                        <Progress value={(stats.pending / stats.total) * 100} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Rejected</CardTitle>
                        <CardDescription>Entries marked as non-learning</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.rejected}</div>
                        <Progress value={(stats.rejected / stats.total) * 100} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="weekly" className="w-full">
                <TabsList>
                    <TabsTrigger value="weekly">Weekly Activity</TabsTrigger>
                    <TabsTrigger value="topics">Topics</TabsTrigger>
                </TabsList>
                <TabsContent value="weekly" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Learning Activity</CardTitle>
                            <CardDescription>Number of entries per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                                        </BarChart>
                                    </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="topics" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Topics</CardTitle>
                            <CardDescription>Most common topics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topicData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                                        </BarChart>
                                    </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
