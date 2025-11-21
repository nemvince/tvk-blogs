import type { Context } from "hono";
import { getMarkdownPage, listBlogPages, marked } from "../lib/markdown";

export const blogListHandler = async (c: Context) => {
	const blogList = await listBlogPages();

	return c.render(
		<main>
			<title>Blog Posts | tvk.lol</title>
			<h1>Blog Posts</h1>
			<div class="blog-list">
				{blogList.map((blog) => (
					<article key={blog.slug} class="blog-entry">
						<header>
							<a href={`/blog/${blog.slug}`}>
								<h2>{blog.title}</h2>
							</a>
							<div class="metadata">
								<time dateTime={blog.date.toISOString()}>
									{blog.date.toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</time>
								{blog.updated > blog.date && (
									<span>
										{" "}
										• Updated{" "}
										<time dateTime={blog.updated.toISOString()}>
											{blog.updated.toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</time>
									</span>
								)}
							</div>
						</header>
					</article>
				))}
			</div>
			{blogList.length === 0 && <p>No blog posts available.</p>}
		</main>,
	);
};

export const blogPostHandler = async (c: Context) => {
	const slug = c.req.param("slug");
	const page = await getMarkdownPage(`blog/${slug}`);

	const innerHTML = { __html: await marked.parse(page.content) };

	return c.render(
		<main>
			<article dangerouslySetInnerHTML={innerHTML}></article>
		</main>,
	);
};
