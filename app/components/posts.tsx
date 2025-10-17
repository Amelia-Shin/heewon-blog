import Link from 'next/link'
import Image from 'next/image'
import { formatDate, getBlogPosts } from 'app/blog/utils'

export async function BlogPosts() {
  let allBlogs = await getBlogPosts()

  return (
    <div className="space-y-6">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1
          }
          return 1
        })
        .map((post) => (
          <Link
            key={post.slug}
            className="flex flex-col md:flex-row gap-4 group hover:opacity-80 transition-opacity"
            href={post.isVelogPost ? post.velogUrl! : `/blog/${post.slug}`}
            target={post.isVelogPost ? "_blank" : undefined}
            rel={post.isVelogPost ? "noopener noreferrer" : undefined}
          >
            {post.metadata.image && (
              <div className="w-full md:w-48 h-32 relative flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={post.metadata.image}
                  alt={post.metadata.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 192px"
                />
              </div>
            )}
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <time className="tabular-nums">
                  {formatDate(post.metadata.publishedAt, false)}
                </time>
                {post.isVelogPost && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800">
                    Velog
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {post.metadata.title}
              </h3>
              {post.metadata.summary && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {post.metadata.summary}
                </p>
              )}
            </div>
          </Link>
        ))}
    </div>
  )
}
