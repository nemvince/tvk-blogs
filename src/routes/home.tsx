import type { Context } from "hono";
import { getMarkdownPage, marked } from "../lib/markdown";

export const homeHandler = async (c: Context) => {
	const page = await getMarkdownPage("index");
	const innerHTML = {
		__html: await marked.parse(page.content),
	};

	return c.render(
		<main>
			<article dangerouslySetInnerHTML={innerHTML}></article>
		</main>,
		{
			title: page.title,
			description: page.description,
		},
	);
};
