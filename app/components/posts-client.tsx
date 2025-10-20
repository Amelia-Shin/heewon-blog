'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from 'app/blog/format-date'
import { useState, useEffect, useRef } from 'react'
import type { BlogPost } from 'app/blog/utils'

// Function to calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// Function to get category from tags
function getCategory(post: BlogPost): string {
  if (post.tags && post.tags.length > 0) {
    return post.tags[0]
  }
  if (post.isVelogPost) {
    return 'Velog'
  }
  return 'Uncategorized'
}

// Function to get all unique categories
function getAllCategories(posts: BlogPost[]): string[] {
  const categories = new Set<string>()
  posts.forEach(post => {
    categories.add(getCategory(post))
  })
  return ['All', ...Array.from(categories).sort()]
}

export function BlogPostsClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [itemsPerLoad, setItemsPerLoad] = useState(6)
  const [displayCount, setDisplayCount] = useState(6)
  const [isLoading, setIsLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const sortedPosts = initialPosts.sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1
    }
    return 1
  })

  const categories = getAllCategories(sortedPosts)

  const filteredPosts = sortedPosts.filter(post => {
    if (selectedCategory === 'All') return true
    return getCategory(post) === selectedCategory
  })

  // Reset display count when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setDisplayCount(itemsPerLoad)
  }

  const handleItemsPerLoadChange = (num: number) => {
    setItemsPerLoad(num)
    setDisplayCount(num)
  }

  const totalCount = filteredPosts.length
  const displayedPosts = filteredPosts.slice(0, displayCount)
  const hasMore = displayCount < totalCount

  // Load more posts
  const loadMore = () => {
    if (!hasMore || isLoading) return

    setIsLoading(true)
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + itemsPerLoad, totalCount))
      setIsLoading(false)
    }, 300)
  }

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [hasMore, isLoading, displayCount, itemsPerLoad])

  // Reset display count when filtered posts change
  useEffect(() => {
    setDisplayCount(itemsPerLoad)
  }, [selectedCategory, itemsPerLoad])

  return (
    <div className="space-y-6">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-3 flex-wrap border-b border-neutral-200 dark:border-neutral-800 pb-4">
        {categories.map(category => {
          const count = category === 'All'
            ? sortedPosts.length
            : sortedPosts.filter(post => getCategory(post) === category).length

          return (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {category} ({count})
            </button>
          )
        })}
      </div>

      {/* Items Per Load Control */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <label htmlFor="items-per-load" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Items per load:
          </label>
          <select
            id="items-per-load"
            value={itemsPerLoad}
            onChange={(e) => handleItemsPerLoadChange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </div>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Showing {displayCount} of {totalCount}
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedPosts.map((post) => {
          const readingTime = calculateReadingTime(post.content)
          const category = getCategory(post)

          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-neutral-900">
                {/* Image */}
                {post.metadata.image && (
                  <div className="w-full h-48 relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <Image
                      src={post.metadata.image}
                      alt={post.metadata.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-3">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300">
                      {category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                    {post.metadata.title}
                  </h3>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <time className="tabular-nums">
                        {formatDate(post.metadata.publishedAt, false)}
                      </time>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{readingTime}분</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Infinite Scroll Loader */}
      <div ref={loaderRef} className="flex items-center justify-center py-8">
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Loading more...</span>
          </div>
        )}
        {!hasMore && displayCount > 0 && (
          <div className="text-center text-neutral-500 dark:text-neutral-400">
            <p className="text-sm font-medium">You've reached the end</p>
          </div>
        )}
      </div>

      {/* Manual Load More Button (fallback) */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="px-6 py-3 rounded-lg text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
