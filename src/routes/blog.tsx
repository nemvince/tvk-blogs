import type { Context } from "hono";
import {
	getMarkdownPage,
	getPostsByTag,
	getRelatedPosts,
	listBlogPages,
	marked,
} from "../lib/markdown";

export const blogListHandler = async (c: Context) => {
	const blogList = await listBlogPages();

	return c.render(
		<main>
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
		{
			title: "Blog Posts | tvk.lol",
			description: "Read my latest blog posts.",
		},
	);
};

export const blogPostHandler = async (c: Context) => {
	const slug = c.req.param("slug");
	const page = await getMarkdownPage(`blog/${slug}`);
	const relatedPosts = await getRelatedPosts(slug, page.tags);

	const innerHTML = { __html: await marked.parse(page.content) };

	return c.render(
		<main>
			<article dangerouslySetInnerHTML={innerHTML}></article>
			{page.tags && page.tags.length > 0 && (
				<div class="tags-section">
					<h3>Tags:</h3>
					<div class="tags">
						{page.tags.map((tag) => (
							<a href={`/tags/${tag}`} class="tag">
								#{tag}
							</a>
						))}
					</div>
				</div>
			)}
			{relatedPosts.length > 0 && (
				<div class="related-posts">
					<h3>Related Posts</h3>
					<ul>
						{relatedPosts.map((post) => (
							<li key={post.slug}>
								<a href={`/blog/${post.slug}`}>{post.title}</a>
							</li>
						))}
					</ul>
				</div>
			)}
		</main>,
		{
			title: page.title,
			description: page.description,
			type: "article",
		},
	);
};

export const tagListHandler = async (c: Context) => {
	const tag = c.req.param("tag");
	const blogList = await getPostsByTag(tag);

	return c.render(
		<main>
			<h1>Posts tagged with "#{tag}"</h1>
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
							</div>
						</header>
					</article>
				))}
			</div>
			{blogList.length === 0 && <p>No posts found with this tag.</p>}
		</main>,
		{
			title: `Posts tagged #${tag} | tvk.lol`,
			description: `List of blog posts tagged with ${tag}`,
		},
	);
};
