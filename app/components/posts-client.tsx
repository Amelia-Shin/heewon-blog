'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from 'app/blog/format-date'
import { useState } from 'react'
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
  const [limit, setLimit] = useState<number | null>(null)

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

  const displayedPosts = limit ? filteredPosts.slice(0, limit) : filteredPosts
  const totalCount = filteredPosts.length

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
              onClick={() => setSelectedCategory(category)}
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

      {/* Limit Control */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Show:
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setLimit(null)}
            className={`px-3 py-1 rounded text-sm ${
              limit === null
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            All
          </button>
          {[6, 12, 24].map(num => (
            <button
              key={num}
              onClick={() => setLimit(num)}
              className={`px-3 py-1 rounded text-sm ${
                limit === num
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Showing {displayedPosts.length} of {totalCount}
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
    </div>
  )
}
