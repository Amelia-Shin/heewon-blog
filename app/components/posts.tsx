import { getBlogPosts } from 'app/blog/utils'
import { BlogPostsClient } from './posts-client'

// Server component wrapper
export async function BlogPostsWrapper() {
  const posts = await getBlogPosts()
  return <BlogPostsClient initialPosts={posts} />
}
