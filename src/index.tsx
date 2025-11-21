import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { jsxRenderer } from "hono/jsx-renderer";
import { getMarkdownPage, listBlogPages, marked } from "./markdown";
import { HTTPException } from "hono/http-exception";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const app = new Hono();

app.onError((e, c) => {
	console.error("An error occurred:", e);
	c.status(500);
	if (e instanceof HTTPException) {
		if (e.status === 404) {
			return c.render(
				<main class="center">
					<h1>404 - Not Found</h1>
					<pre>{e.message ?? "The requested resource was not found."}</pre>
				</main>,
			);
		}
	}
	return c.render(
		<main class="center">
			<h1>500 - Internal Server Error</h1>
			<pre>{e.message ?? "An unexpected error occurred."}</pre>
		</main>,
	);
});

app.post("/webhook", async (c) => {
	const signature = c.req.header("x-webhook-signature") || "";
	const body = await c.req.text();

	if (signature !== WEBHOOK_SECRET) {
		return c.text("Unauthorized", 401);
	}

	console.log("Received webhook payload:", body);

	return c.text("Webhook received", 200);
});

app.use("/public/*", serveStatic({ root: "./" }));

app.get(
	"/*",
	jsxRenderer(({ children }) => {
		return (
			<html lang="en">
				<head>
					<link
						rel="shortcut icon"
						href="/public/favicon.png"
						type="image/png"
					/>
					<link rel="stylesheet" href="/public/styles.css" />
				</head>
				<body>
					<header>
						<nav>
							<ul>
								<li>
									<a href="/">Home</a>
								</li>
								<li>
									<a href="/blog">Blog</a>
								</li>
							</ul>
						</nav>
					</header>
					<hr />
					{children}
				</body>
			</html>
		);
	}),
);

app.get("/", async (c) => {
	const innerHTML = {
		__html: await marked.parse((await getMarkdownPage("index")).content),
	};

	return c.render(<main dangerouslySetInnerHTML={innerHTML}></main>);
});

app.get("/blog", async (c) => {
	const blogList = await listBlogPages();

	return c.render(
		<main>
			<title>Blog Posts | tvk.lol</title>
			<h1>Blog Posts</h1>
			<ul>
				{blogList.map((blog) => (
					<li key={blog.slug}>
						<a href={`/blog/${blog.slug}`}>{blog.title}</a>
					</li>
				))}
			</ul>
			{blogList.length === 0 && <p>No blog posts available.</p>}
		</main>,
	);
});

app.get("/blog/:slug", async (c) => {
	const slug = c.req.param("slug");
	const page = await getMarkdownPage(`blog/${slug}`);

	const innerHTML = { __html: await marked.parse(page.content) };

	return c.render(
		<main>
			<article dangerouslySetInnerHTML={innerHTML}></article>
		</main>,
	);
});

export default app;
