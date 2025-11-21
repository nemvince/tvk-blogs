import fs from "node:fs/promises";
import hljs from "highlight.js";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { HTTPException
 } from 'hono/http-exception'
type MarkdownPage = {
	title: string;
	date: Date;
	updated: Date;
	content: string;
	slug?: string;
};

export const marked = new Marked(
	markedHighlight({
		emptyLangClass: "hljs",
		langPrefix: "hljs language-",
		highlight(code, lang, _info) {
			const language = hljs.getLanguage(lang) ? lang : "plaintext";
			return hljs.highlight(code, { language }).value;
		},
	}),
);

export const getMarkdownPage = async (
	fileName: string,
): Promise<MarkdownPage> => {
	const filePath = `./data/${fileName}.md`;

	if (
		!(await fs
			.access(filePath)
			.then(() => true)
			.catch(() => false))
	) {
		throw new HTTPException(404, { message: `Markdown file ${fileName} not found` });
	}

	const fileContent = await fs.readFile(filePath, "utf-8");
	const metaEndIndex = fileContent
		.split("\n")
		.findIndex((line) => !line.startsWith(".") && line.trim() !== "");

	const content = fileContent.split("\n").slice(metaEndIndex).join("\n").trim();

	if (metaEndIndex === -1) {
		return {
			title: "Untitled",
			date: new Date(0),
			updated: new Date(0),
			content: fileContent,
		};
	}

	const metadataLines = fileContent
		.split("\n")
		.slice(0, metaEndIndex)
		.filter((line) => line.startsWith("."))
		.map((line) => line.replace(/^\.+\s*/, "").trim());

	const titleLine = metadataLines.find((line) =>
		line.toLowerCase().startsWith("title:"),
	);
	const dateLine = metadataLines.find((line) =>
		line.toLowerCase().startsWith("date:"),
	);
	const updatedLine = metadataLines.find((line) =>
		line.toLowerCase().startsWith("updated:"),
	);
	let date = new Date(0);
	if (dateLine) {
		const dateString = dateLine.replace(/^date:\s*/i, "").trim();
		const parsedDate = new Date(dateString);
		if (!Number.isNaN(parsedDate.getTime())) {
			date = parsedDate;
		} else {
			console.warn(
				`Invalid date format in metadata for ${fileName}, using epoch`,
			);
		}
	} else {
		console.warn(`No date found in metadata for ${fileName}, using epoch`);
	}

	let updated = new Date(0);
	if (updatedLine) {
		const updatedString = updatedLine.replace(/^updated:\s*/i, "").trim();
		const parsedUpdated = new Date(updatedString);
		if (!Number.isNaN(parsedUpdated.getTime())) {
			updated = parsedUpdated;
		} else {
			console.warn(
				`Invalid updated format in metadata for ${fileName}, using epoch`,
			);
		}
	} else {
		console.warn(`No updated found in metadata for ${fileName}, using epoch`);
	}

	let title = "Untitled";
	if (titleLine) {
		title = titleLine.replace(/^title:\s*/i, "").trim();
	} else {
		console.warn(
			`No title found in metadata for ${fileName}, using 'Untitled'`,
		);
	}

	return {
		slug: fileName.split("/").pop(),
		title,
		content,
		date,
		updated,
	};
};

export const listBlogPages = async () => {
	const files = await fs.readdir("./data/blog");
	const pages = await Promise.all(
		files
			.filter((file) => file.endsWith(".md"))
			.map(async (file) => {
				const page = await getMarkdownPage(`blog/${file.slice(0, -3)}`);
				return page;
			}),
	);

	return pages;
};
