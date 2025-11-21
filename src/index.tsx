import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { jsxRenderer } from "hono/jsx-renderer";
import { ErrorPage } from "./components/ErrorPage";
import { Layout } from "./components/Layout";
import { blogListHandler, blogPostHandler } from "./routes/blog";
import { homeHandler } from "./routes/home";
import { webhookHandler } from "./routes/webhook";

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
			);
		}
	}

	c.status(500);
	return c.render(
		<ErrorPage
			status={500}
			message={e.message ?? "An unexpected error occurred."}
		/>,
	);
});

app.post("/webhook", webhookHandler);

app.use("/public/*", serveStatic({ root: "./" }));

app.get(
	"/*",
	jsxRenderer(({ children }) => {
		return <Layout>{children}</Layout>;
	}),
);

app.get("/", homeHandler);
app.get("/blog", blogListHandler);
app.get("/blog/:slug", blogPostHandler);

export default app;
