// This file simulates spaCy processing. In a real-world scenario,
// this would be an API call to a Python backend running spaCy.

import stringSimilarity from "string-similarity-js"

interface SpacyResult {
    tags: string[]
    keywords: string[]
    primaryTopic: string
    summary?: string
    isLearningContent: boolean
    isVideo: boolean
}

// Cache for processed results to avoid reprocessing same content
const processedCache = new Map<string, SpacyResult>()

// Predefined categories and their associated keywords
const categories = {
    programming: {
        keywords: ["javascript", "python", "java", "c++", "typescript", "react", "node", "express", "django", "flask"],
        tags: ["code", "programming", "development", "software"]
    },
    web: {
        keywords: ["html", "css", "frontend", "backend", "fullstack", "web", "browser", "dom", "api", "rest"],
        tags: ["web", "frontend", "backend", "fullstack"]
    },
    data: {
        keywords: ["data", "database", "sql", "nosql", "mongodb", "postgres", "mysql", "redis", "analytics"],
        tags: ["data", "database", "analytics"]
    },
    devops: {
        keywords: ["docker", "kubernetes", "aws", "azure", "cloud", "ci", "cd", "deployment", "infrastructure"],
        tags: ["devops", "cloud", "infrastructure"]
    },
    ai: {
        keywords: ["ai", "ml", "machine learning", "neural", "tensorflow", "pytorch", "deep learning", "artificial intelligence", "neural networks", "nlp", "natural language processing", "computer vision", "cv", "reinforcement learning", "rl", "gpt", "llm", "large language model"],
        tags: ["ai", "ml", "deep learning", "artificial intelligence", "machine learning"]
    }
}

// Learning indicators
const learningKeywords = {
    tutorial: ["tutorial", "guide", "how to", "learn", "basics", "advanced"],
    course: ["course", "class", "lecture", "lesson", "module", "section"],
    documentation: ["docs", "documentation", "reference", "api", "manual"],
    practice: ["exercise", "practice", "challenge", "project", "assignment"]
}

// Exclude terms that indicate non-learning content
const excludeTerms = ["fun", "game", "entertainment", "vlog", "music", "news", "social"]

// Learning content indicators
const learningDomains = [
    'github.com',
    'stackoverflow.com',
    'developer.mozilla.org',
    'docs.microsoft.com',
    'w3schools.com',
    'geeksforgeeks.org',
    'udemy.com',
    'coursera.org',
    'edx.org',
    'freecodecamp.org',
    'codecademy.com',
    'leetcode.com',
    'hackerrank.com',
    'medium.com',
    'dev.to',
    'hashnode.com',
    'css-tricks.com',
    'smashingmagazine.com',
    'sitepoint.com',
    'web.dev',
    'developer.chrome.com',
    'reactjs.org',
    'vuejs.org',
    'angular.io',
    'nodejs.org',
    'expressjs.com',
    'mongodb.com/docs',
    'postgresql.org/docs',
    'redis.io/docs',
    'docker.com/docs',
    'kubernetes.io/docs'
]

const learningPatterns = [
    /tutorial/i,
    /guide/i,
    /documentation/i,
    /learn/i,
    /course/i,
    /lesson/i,
    /how-to/i,
    /getting-started/i,
    /examples?/i,
    /reference/i,
    /api/i,
    /docs?/i,
    /manual/i,
    /handbook/i,
    /book/i,
    /article/i,
    /blog/i,
    /post/i,
    /explanation/i,
    /overview/i
]

// Non-learning content indicators (with high confidence)
const nonLearningDomains = [
    'mail.google.com',
    'calendar.google.com',
    'drive.google.com',
    'chat.google.com',
    'meet.google.com',
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com/feed',
    'reddit.com/r/',
    'youtube.com/watch', // Regular YouTube videos
    'netflix.com',
    'spotify.com',
    'amazon.com',
    'ebay.com',
    'wikipedia.org/wiki/List',
    'wikipedia.org/wiki/Category'
]

const nonLearningPatterns = [
    /^https?:\/\/[^/]+\/login/i,
    /^https?:\/\/[^/]+\/signup/i,
    /^https?:\/\/[^/]+\/account/i,
    /^https?:\/\/[^/]+\/profile/i,
    /^https?:\/\/[^/]+\/settings/i,
    /^https?:\/\/[^/]+\/cart/i,
    /^https?:\/\/[^/]+\/checkout/i,
    /^https?:\/\/[^/]+\/payment/i,
    /^https?:\/\/[^/]+\/order/i,
    /^https?:\/\/[^/]+\/shipping/i
]

// Video platform domains
const videoPlatforms = [
    'youtube.com',
    'vimeo.com',
    'udemy.com',
    'coursera.org',
    'edx.org',
    'pluralsight.com',
    'linkedin.com/learning',
    'skillshare.com',
    'khanacademy.org',
    'freecodecamp.org/videos',
    'egghead.io',
    'frontendmasters.com',
    'scrimba.com',
    'codecademy.com/videos',
    'teamtreehouse.com',
    'lynda.com',
    'udacity.com',
    'datacamp.com',
    'brilliant.org',
    'masterclass.com'
]

/**
 * Process text with simulated spaCy to extract tags, keywords, and primary topic.
 * In production, this would call a dedicated NLP service.
 */
export async function processWithSpacy(title: string, url: string): Promise<SpacyResult> {
    console.log(`[spaCy] Processing: "${title}" from ${url}`)

    // Check cache first
    const cacheKey = `${title}:${url}`
    const cached = processedCache.get(cacheKey)
    if (cached) {
        console.log(`[spaCy] Using cached result for: ${title}`)
        return cached
    }

    const lowerTitle = title.toLowerCase()
    const lowerUrl = url.toLowerCase()
    let isLearningContent = false
    let isVideo = false

    // Check if it's a video platform
    isVideo = videoPlatforms.some(platform => lowerUrl.includes(platform))

    // Check for non-learning content first (high confidence exclusions)
    if (nonLearningDomains.some(domain => lowerUrl.includes(domain)) ||
        nonLearningPatterns.some(pattern => pattern.test(url))) {
        console.log(`[spaCy] Excluded non-learning content: ${url}`)
        return {
            tags: [],
            keywords: [],
            primaryTopic: "Excluded",
            summary: "Non-learning content",
            isLearningContent: false,
            isVideo: false
        }
    }

    // Check for learning content indicators
    const hasLearningDomain = learningDomains.some(domain => lowerUrl.includes(domain))
    const hasLearningPattern = learningPatterns.some(pattern => pattern.test(title) || pattern.test(url))
    const hasLearningKeyword = Object.values(learningKeywords).some(keywords =>
        keywords.some(keyword => lowerTitle.includes(keyword))
    )

    // Consider it learning content if it matches any of the criteria
    isLearningContent = hasLearningDomain || hasLearningPattern || hasLearningKeyword

    const extractedTags: string[] = []
    const extractedKeywords: string[] = []
    let primaryTopic = "General"

    // Extract domain-specific tags and keywords
    for (const [category, { keywords, tags }] of Object.entries(categories)) {
        const matchingKeywords = keywords.filter(keyword => lowerTitle.includes(keyword))
        if (matchingKeywords.length > 0) {
            extractedTags.push(...tags)
            extractedKeywords.push(...matchingKeywords)
            // If this is the first category with matches, set it as primary topic
            if (primaryTopic === "General") {
                primaryTopic = category.charAt(0).toUpperCase() + category.slice(1)
            }
        }
    }

    // Extract learning type tags
    for (const [type, keywords] of Object.entries(learningKeywords)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
            extractedTags.push(type)
        }
    }

    // Extract domain from URL
    if (url.includes("github.com")) {
        extractedTags.push("code", "repository")
    } else if (url.includes("stackoverflow.com")) {
        extractedTags.push("qa", "solution")
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        extractedTags.push("video")
        if (lowerTitle.includes("tutorial")) extractedTags.push("tutorial")
    } else if (url.includes("udemy.com") || url.includes("coursera.org")) {
        extractedTags.push("course")
    }

    // Find best matching category for primary topic
    let bestMatch = { category: primaryTopic, score: 0 }
    for (const [category, { keywords }] of Object.entries(categories)) {
        const score = Math.max(...keywords.map(keyword => stringSimilarity(lowerTitle, keyword)))
        if (score > bestMatch.score) {
            bestMatch = { category, score }
        }
    }

    if (bestMatch.score > 0.3) {
        primaryTopic = bestMatch.category.charAt(0).toUpperCase() + bestMatch.category.slice(1)
    }

    // Filter out exclude terms
    const filteredTags = extractedTags.filter(tag => !excludeTerms.includes(tag))
    const filteredKeywords = extractedKeywords.filter(keyword => !excludeTerms.includes(keyword))

    // Generate summary
    const summary = `Learning content about ${primaryTopic.toLowerCase()}. ` +
        `Covers topics like ${filteredTags.slice(0, 3).join(", ")}. ` +
        `This appears to be a ${filteredTags.find(tag => ["tutorial", "course", "documentation"].includes(tag)) || "learning resource"}.`

    const result: SpacyResult = {
        tags: Array.from(new Set(filteredTags)),
        keywords: Array.from(new Set(filteredKeywords)),
        primaryTopic,
        summary,
        isLearningContent,
        isVideo
    }

    // Cache the result
    processedCache.set(cacheKey, result)

    console.log(`[spaCy] Tags: ${result.tags.join(", ")}`)
    console.log(`[spaCy] Keywords: ${result.keywords.join(", ")}`)
    console.log(`[spaCy] Primary Topic: ${result.primaryTopic}`)
    console.log(`[spaCy] Is Learning Content: ${result.isLearningContent}`)
    console.log(`[spaCy] Is Video: ${result.isVideo}`)

    return result
}
