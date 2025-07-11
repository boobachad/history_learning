"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { EntryList } from "@/components/entry-list"
import { fetchEntries } from "@/lib/api"
import { toast } from "sonner"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { type Entry } from "@/types/entry"
import Link from "next/link"

export default function EntriesPage() {
    const searchParams = useSearchParams()
    const [entries, setEntries] = useState<Entry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filter, setFilter] = useState({
        status: searchParams.get("status") || "all",
        search: searchParams.get("search") || "",
        sort: searchParams.get("sort") || "newest",
    })

    useEffect(() => {
        const loadEntries = async () => {
            try {
                setIsLoading(true)
                const result = await fetchEntries({
                    page,
                    status: filter.status,
                    search: filter.search,
                    sort: filter.sort,
                })

                setEntries(result.entries)
                setTotalPages(result.pagination.totalPages)
            } catch (error) {
                console.error("Failed to load entries:", error)
                toast.error("Error loading entries", {
                    description: "Please try again later",
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadEntries()
    }, [page, filter])

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // Update URL with search params
        const url = new URL(window.location.href)
        url.searchParams.set("search", filter.search)
        url.searchParams.set("status", filter.status)
        url.searchParams.set("sort", filter.sort)
        window.history.pushState({}, "", url)

        setPage(1) // Reset to first page on new search
    }

    const handleEntryUpdate = () => {
        // Refresh the entries list
        const loadEntries = async () => {
            try {
                setIsLoading(true)
                const result = await fetchEntries({
                    page,
                    status: filter.status,
                    search: filter.search,
                    sort: filter.sort,
                })

                setEntries(result.entries)
                setTotalPages(result.pagination.totalPages)
            } catch (error) {
                console.error("Failed to load entries:", error)
                toast.error("Error loading entries", {
                    description: "Please try again later",
                })
            } finally {
                setIsLoading(false)
            }
        }
        loadEntries()
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Entries</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Learning Entries</h1>
                        <p className="text-muted-foreground">Browse and manage your learning activities</p>
                    </div>
                    <Button variant="outline">Export Data</Button>
                </div>
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mt-4">
                    <Input
                        type="text"
                        placeholder="Search entries..."
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className="flex-1"
                    />
                    <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                        <SelectTrigger className="md:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filter.sort} onValueChange={(value) => setFilter({ ...filter, sort: value })}>
                        <SelectTrigger className="md:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="title">Title A-Z</SelectItem>
                            <SelectItem value="confidence">Confidence</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit">Filter</Button>
                </form>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <EntryList entries={entries} onEntryUpdate={handleEntryUpdate} />
            )}

            <div className="flex justify-center gap-2 mt-8">
                <Link
                    href={`/entries?page=${page - 1}${searchParams.toString() ? `&${searchParams.toString().replace(/page=\d+&?/, '')}` : ''}`}
                    className={`px-4 py-2 rounded ${page <= 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800"
                        }`}
                    onClick={(e) => {
                        if (page <= 1) {
                            e.preventDefault()
                        } else {
                            setPage(page - 1)
                        }
                    }}
                >
                    Previous
                </Link>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Show first page, last page, current page, and pages around current page
                    const shouldShow =
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - page) <= 1;

                    if (!shouldShow) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                            return <span key={`ellipsis-${pageNum}`} className="px-2">...</span>;
                        }
                        return null;
                    }

                    return (
                        <Link
                            key={pageNum}
                            href={`/entries?page=${pageNum}${searchParams.toString() ? `&${searchParams.toString().replace(/page=\d+&?/, '')}` : ''}`}
                            className={`px-4 py-2 rounded ${pageNum === page
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            onClick={(e) => {
                                e.preventDefault()
                                    setPage(pageNum)
                                }}
                            >
                                {pageNum}
                        </Link>
                    );
                })}

                <Link
                    href={`/entries?page=${page + 1}${searchParams.toString() ? `&${searchParams.toString().replace(/page=\d+&?/, '')}` : ''}`}
                    className={`px-4 py-2 rounded ${page >= totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800"
                        }`}
                            onClick={(e) => {
                        if (page >= totalPages) {
                                e.preventDefault()
                        } else {
                            setPage(page + 1)
                        }
                    }}
                >
                    Next
                </Link>
            </div>
        </div>
    )
}
