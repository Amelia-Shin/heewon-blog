import fs from "fs";
import path from "path";

type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  tags?: string[];
  velogUrl?: string;
};

export type BlogPost = {
  metadata: Metadata;
  slug: string;
  content: string;
  isVelogPost?: boolean;
  velogUrl?: string;
  tags?: string[];
};

function parseFrontmatter(fileContent: string) {
  let frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  let match = frontmatterRegex.exec(fileContent);
  let frontMatterBlock = match![1];
  let content = fileContent.replace(frontmatterRegex, "").trim();
  let frontMatterLines = frontMatterBlock.trim().split("\n");
  let metadata: Partial<Metadata> = {};

  frontMatterLines.forEach((line) => {
    let [key, ...valueArr] = line.split(": ");
    let value = valueArr.join(": ").trim();
    value = value.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes

    // Parse tags as array
    if (key.trim() === "tags") {
      try {
        metadata.tags = JSON.parse(value);
      } catch {
        metadata.tags = [];
      }
    } else {
      metadata[key.trim() as keyof Metadata] = value;
    }
  });

  return { metadata: metadata as Metadata, content };
}

function getMDXFiles(dir) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath) {
  let rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

function getMDXData(dir) {
  let mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    let { metadata, content } = readMDXFile(path.join(dir, file));
    let slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const postsDir = path.join(process.cwd(), "posts");

  // Get local MDX posts from root posts directory
  const localPosts = getMDXData(postsDir);

  // Get Velog MDX posts from posts/velog directory
  const velogDir = path.join(postsDir, "velog");
  let velogPosts: BlogPost[] = [];

  if (fs.existsSync(velogDir)) {
    velogPosts = getMDXData(velogDir).map((post) => {
      // Extract slug from velogUrl if it exists (e.g., https://velog.io/@username/slug-name -> slug-name)
      let slug = post.slug;
      if (post.metadata.velogUrl) {
        const urlParts = post.metadata.velogUrl.split('/');
        const velogSlug = urlParts[urlParts.length - 1];
        if (velogSlug) {
          slug = velogSlug;
        }
      }

      return {
        ...post,
        slug,
        isVelogPost: !!post.metadata.velogUrl,
        velogUrl: post.metadata.velogUrl,
        tags: post.metadata.tags,
      };
    });
  }

  // Combine and sort by date (newest first)
  const allPosts = [...localPosts, ...velogPosts].sort((a, b) => {
    const dateA = new Date(a.metadata.publishedAt);
    const dateB = new Date(b.metadata.publishedAt);
    return dateB.getTime() - dateA.getTime();
  });

  return allPosts;
}

export function formatDate(date: string, includeRelative = false) {
  let currentDate = new Date();
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  let targetDate = new Date(date);

  let yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  let monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  let daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  let fullDate = targetDate.toLocaleString("en-us", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${formattedDate})`;
}
