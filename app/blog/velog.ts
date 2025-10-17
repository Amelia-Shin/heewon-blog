type VelogPost = {
  id: string;
  title: string;
  short_description: string;
  thumbnail: string | null;
  user: {
    username: string;
  };
  url_slug: string;
  released_at: string;
  updated_at: string;
  tags: string[];
};

type VelogPostDetail = VelogPost & {
  body: string;
};

type VelogResponse = {
  data: {
    posts: VelogPost[];
  };
};

type VelogPostDetailResponse = {
  data: {
    post: VelogPostDetail;
  };
};

const VELOG_GRAPHQL_ENDPOINT = "https://v2cdn.velog.io/graphql";

export async function fetchVelogPosts(
  username: string,
  limit: number = 20
): Promise<VelogPost[]> {
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
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Velog posts:", response.statusText);
      return [];
    }

    const result: VelogResponse = await response.json();
    return result.data.posts || [];
  } catch (error) {
    console.error("Error fetching Velog posts:", error);
    return [];
  }
}

export async function fetchVelogPostDetail(
  username: string,
  urlSlug: string
): Promise<VelogPostDetail | null> {
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
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Velog post detail:", response.statusText);
      return null;
    }

    const result: VelogPostDetailResponse = await response.json();
    return result.data.post || null;
  } catch (error) {
    console.error("Error fetching Velog post detail:", error);
    return null;
  }
}

export function convertVelogPostToLocalFormat(post: VelogPost) {
  return {
    metadata: {
      title: post.title,
      publishedAt: post.released_at,
      summary: post.short_description || "",
      image: post.thumbnail || undefined,
    },
    slug: post.url_slug,
    content: "", // Velog posts don't include full content in list
    isVelogPost: true,
    velogUrl: `https://velog.io/@${post.user.username}/${post.url_slug}`,
    tags: post.tags,
  };
}
