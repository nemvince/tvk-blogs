import type { Context } from "hono";
import { ErrorBoundary, Suspense } from "hono/jsx";
import { getMarkdownPage, marked } from "../lib/markdown";

const HomeContent = async () => {
	const page = await getMarkdownPage("index");
	const innerHTML = {
		__html: await marked.parse(page.content),
	};

	return <article dangerouslySetInnerHTML={innerHTML}></article>;
};

export const homeHandler = async (c: Context) => {
	const page = await getMarkdownPage("index");

	return c.render(
		<main>
			<ErrorBoundary fallback={<div>Error loading content.</div>}>
				<Suspense fallback={<div>Loading...</div>}>
					<HomeContent />
				</Suspense>
			</ErrorBoundary>
		</main>,
		{
			title: page.title,
		},
	);
};
