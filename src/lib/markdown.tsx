import { access, readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";
import hljs from "highlight.js";
import { HTTPException } from "hono/http-exception";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";

export type MarkdownPage = {
	title: string;
	date: Date;
	updated: Date;
	content: string;
};

export type BlogPage = MarkdownPage & {
	slug: string;
	description: string;
	draft: boolean;
	tags: string[];
};

export const marked = new Marked(
	markedHighlight({
		emptyLangClass: "hljs",
		langPrefix: "hljs language-",
		highlight(code: string, lang: string) {
			const language = hljs.getLanguage(lang) ? lang : "plaintext";
			return hljs.highlight(code, { language }).value;
		},
	}),
);

const parseDate = (
	dateValue: string | Date | undefined,
	fileName: string,
	field: string,
): Date => {
	if (!dateValue) {
		if (field !== "updated")
			console.warn(
				`No ${field} found in metadata for ${fileName}, using epoch`,
			);
		return new Date(0);
	}
	if (dateValue instanceof Date) {
		return dateValue;
	}
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		console.warn(
			`Invalid ${field} format in metadata for ${fileName}, using epoch`,
		);
		return new Date(0);
	}
	return date;
};

export const getMarkdownPage = async (
	fileName: string,
): Promise<MarkdownPage> => {
	const filePath = `./data/${fileName}.md`;

	const exists = await access(filePath)
		.then(() => true)
		.catch(() => false);

	if (!exists) {
		throw new HTTPException(404, {
			message: `Markdown file ${fileName} not found`,
		});
	}

	const fileContent = await readFile(filePath, "utf-8");
	const { data, content } = matter(fileContent);

	const page = {
		slug: fileName.split("/").pop(),
		title: data.title || "Untitled",
		content,
		date: parseDate(data.date, fileName, "date"),
		updated: parseDate(data.updated, fileName, "updated"),
		description: data.description,
		draft: data.draft,
		tags: data.tags,
	};

	return page;
};

export const getBlogPage = async (
	slug: string,
): Promise<BlogPage> => {
	const page = await getMarkdownPage(`blog/${slug}`);
	return page as BlogPage;
};

export const listBlogPages = async (): Promise<BlogPage[]> => {
	const files = await readdir("./data/blog");
	const pages = await Promise.all(
		files
			.filter((file: string) => file.endsWith(".md"))
			.map((file: string) =>
				getBlogPage(file.slice(0, -3)),
			),
	);

	// Filter out drafts and sort by date descending
	return pages
		.filter((page) => !page.draft)
		.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const getPostsByTag = async (tag: string) => {
	const allPosts = await listBlogPages();
	return allPosts.filter((post) => post.tags?.includes(tag));
};

export const getRelatedPosts = async (
	currentSlug: string,
	tags: string[] = [],
) => {
	if (tags.length === 0) return [];

	const allPosts = await listBlogPages();

	return allPosts
		.filter((post) => post.slug !== currentSlug && !post.draft)
		.map((post) => ({
			post,
			overlap:
				post.tags?.filter((tag: string) => tags.includes(tag)).length || 0,
		}))
		.filter((item) => item.overlap > 0)
		.sort((a, b) => b.overlap - a.overlap)
		.slice(0, 3)
		.map((item) => item.post);
};
