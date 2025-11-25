import type { FC, PropsWithChildren } from "hono/jsx";

interface LayoutProps {
	title?: string;
	description?: string;
	image?: string;
	type?: "website" | "article";
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({
	children,
	title = "tvk.lol",
	description = "Vince's personal blog.",
	image = "/public/favicon.png",
	type = "website",
}) => {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>{title}</title>
				<meta name="description" content={description} />

				{/* Open Graph */}
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:image" content={image} />
				<meta property="og:type" content={type} />

				{/* Twitter */}
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={title} />
				<meta name="twitter:description" content={description} />
				<meta name="twitter:image" content={image} />

				<link rel="shortcut icon" href="/public/favicon.png" type="image/png" />
				<link rel="stylesheet" href="/public/styles.css" />
				<script src="/public/client.js" defer></script>
			</head>
			<body>
				<header>
					<nav>
						<ul>
							<li>
								<span>tvk.lol</span>
							</li>
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
};
