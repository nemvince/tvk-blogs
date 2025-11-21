import type { Context } from "hono";
import { getMarkdownPage, marked } from "../lib/markdown";

export const homeHandler = async (c: Context) => {
	const page = await getMarkdownPage("index");
	const innerHTML = {
		__html: await marked.parse(page.content),
	};

	return c.render(<>
    <title>{page.title}</title>
    <main dangerouslySetInnerHTML={innerHTML}></main>
    </>);
};
