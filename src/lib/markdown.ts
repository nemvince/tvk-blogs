import fs from "node:fs/promises";
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
	slug?: string;
	description?: string;
	draft?: boolean;
};

export const marked = new Marked(
	markedHighlight({
		emptyLangClass: "hljs",
		langPrefix: "hljs language-",
		highlight(code, lang) {
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
		console.warn(`No ${field} found in metadata for ${fileName}, using epoch`);
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

	const exists = await fs
		.access(filePath)
		.then(() => true)
		.catch(() => false);

	if (!exists) {
		throw new HTTPException(404, {
			message: `Markdown file ${fileName} not found`,
		});
	}

	const fileContent = await fs.readFile(filePath, "utf-8");
	const { data, content } = matter(fileContent);

	return {
		slug: fileName.split("/").pop(),
		title: data.title || "Untitled",
		content,
		date: parseDate(data.date, fileName, "date"),
		updated: parseDate(data.updated, fileName, "updated"),
		description: data.description,
		draft: data.draft,
	};
};

export const listBlogPages = async () => {
	const files = await fs.readdir("./data/blog");
	const pages = await Promise.all(
		files
			.filter((file) => file.endsWith(".md"))
			.map((file) => getMarkdownPage(`blog/${file.slice(0, -3)}`)),
	);

	// Filter out drafts and sort by date descending
	return pages
		.filter((page) => !page.draft)
		.sort((a, b) => b.date.getTime() - a.date.getTime());
};
