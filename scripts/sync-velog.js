const fs = require("fs");
const path = require("path");

const VELOG_GRAPHQL_ENDPOINT = "https://v2cdn.velog.io/graphql";

async function fetchVelogPosts(username, limit = 100) {
  const query = `
    query Posts($cursor: ID, $username: String, $limit: Int) {
      posts(cursor: $cursor, username: $username, limit: $limit) {
        id
        title
        short_description
        thumbnail
        user {
          username
        }
        url_slug
        released_at
        updated_at
        tags
      }
    }
  `;

  try {
    const response = await fetch(VELOG_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: "Posts",
        variables: {
          username,
          limit,
        },
        query,
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch Velog posts:", response.statusText);
      return [];
    }

    const result = await response.json();
    return result.data.posts || [];
  } catch (error) {
    console.error("Error fetching Velog posts:", error);
    return [];
  }
}

async function fetchVelogPostDetail(username, urlSlug) {
  const query = `
    query Post($username: String, $url_slug: String) {
      post(username: $username, url_slug: $url_slug) {
        id
        title
        short_description
        thumbnail
        user {
          username
        }
        url_slug
        released_at
        updated_at
        tags
        body
      }
    }
  `;

  try {
    const response = await fetch(VELOG_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: "Post",
        variables: {
          username,
          url_slug: urlSlug,
        },
        query,
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch Velog post detail:", response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data.post || null;
  } catch (error) {
    console.error("Error fetching Velog post detail:", error);
    return null;
  }
}

async function syncVelogPosts() {
  // Load .env.local
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const envLines = envContent.split("\n");
    envLines.forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
  }

  const username = process.env.VELOG_USERNAME;

  if (!username) {
    console.error("VELOG_USERNAME is not set in .env.local");
    process.exit(1);
  }

  console.log(`Fetching posts from @${username}...`);

  // Fetch all posts
  const posts = await fetchVelogPosts(username, 100);

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
