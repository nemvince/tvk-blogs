import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { jsxRenderer } from "hono/jsx-renderer";
import { ErrorPage } from "./components/ErrorPage";
import { Layout } from "./components/Layout";
import { syncContent } from "./lib/sync";
import {
	blogListHandler,
	blogPostHandler,
	tagListHandler,
} from "./routes/blog";
import { homeHandler } from "./routes/home";
import { webhookHandler } from "./routes/webhook";

// Sync content on startup
try {
	console.log("Syncing content...");
	await syncContent();
	console.log("Content synced successfully.");
} catch (e) {
	console.error("Failed to sync content on startup:", e);
}

const app = new Hono();

app.onError((e, c) => {
	console.error("An error occurred:", e);

	if (e instanceof HTTPException) {
		if (e.status === 404) {
			c.status(404);
			return c.render(
				<ErrorPage
					status={404}
					message={e.message ?? "The requested resource was not found."}
				/>,
				{
					title: "404 - Not Found",
				},
			);
		}
	}

	c.status(500);
	return c.render(
		<ErrorPage
			status={500}
			message={e.message ?? "An unexpected error occurred."}
		/>,
		{
			title: "500 - Internal Server Error",
		},
	);
});

app.post("/webhook", webhookHandler);

app.use("/public/*", serveStatic({ root: "./" }));
app.use("/img/*", serveStatic({ root: "./data/" }));

declare module "hono" {
	interface ContextRenderer {
		// biome-ignore lint/style/useShorthandFunctionType: type declaration merging
		(
			content: string | Promise<string>,
			props: {
				title: string;
				description?: string;
				image?: string;
				type?: "website" | "article";
			},
		): Response;
	}
}

app.get(
	"/*",
	jsxRenderer(({ children, title, description, image, type }) => {
		return (
			<Layout
				title={title as string}
				description={description as string}
				image={image as string}
				type={type as "website" | "article"}
			>
				{children}
			</Layout>
		);
	}),
);

app.get("/", homeHandler);
app.get("/blog", blogListHandler);
app.get("/blog/:slug", blogPostHandler);
app.get("/tags/:tag", tagListHandler);

Bun.serve({
	port: 3000,
	fetch: app.fetch,
});

console.info("Server is running on http://localhost:3000");
