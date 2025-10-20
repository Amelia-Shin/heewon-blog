import fs from "fs";
import path from "path";
import { fetchVelogPosts, fetchVelogPostDetail } from "../app/blog/velog";

async function syncVelogPosts() {
  const username = process.env.VELOG_USERNAME;

  if (!username) {
    console.error("VELOG_USERNAME is not set in .env.local");
    process.exit(1);
  }

  console.log(`Fetching posts from @${username}...`);

  // Fetch all posts
  const posts = await fetchVelogPosts(username, 100); // Fetch up to 100 posts

  if (posts.length === 0) {
    console.log("No posts found.");
    return;
  }

  console.log(`Found ${posts.length} posts. Fetching details...`);

  // Create velog directory if it doesn't exist
  const velogDir = path.join(process.cwd(), "posts", "velog");
  if (!fs.existsSync(velogDir)) {
    fs.mkdirSync(velogDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  // Fetch and save each post
  for (const post of posts) {
    try {
      console.log(`Fetching: ${post.title}...`);
      const postDetail = await fetchVelogPostDetail(username, post.url_slug);

      if (!postDetail) {
        console.error(`Failed to fetch details for: ${post.title}`);
        failCount++;
        continue;
      }

      // Convert to MDX format
      const frontmatter = `---
title: ${JSON.stringify(postDetail.title)}
publishedAt: ${postDetail.released_at}
summary: ${JSON.stringify(postDetail.short_description || "")}${
        postDetail.thumbnail ? `\nimage: ${postDetail.thumbnail}` : ""
      }${postDetail.tags.length > 0 ? `\ntags: ${JSON.stringify(postDetail.tags)}` : ""}
velogUrl: https://velog.io/@${username}/${postDetail.url_slug}
---

`;

      const mdxContent = frontmatter + postDetail.body;

      // Save to file
      const filename = `${postDetail.url_slug}.mdx`;
      const filepath = path.join(velogDir, filename);
      fs.writeFileSync(filepath, mdxContent, "utf-8");

      console.log(`✓ Saved: ${filename}`);
      successCount++;

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing ${post.title}:`, error);
      failCount++;
    }
  }

  console.log("\nSync completed!");
  console.log(`Success: ${successCount}, Failed: ${failCount}`);
}

syncVelogPosts().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
