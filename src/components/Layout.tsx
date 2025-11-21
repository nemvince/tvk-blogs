import type { FC, PropsWithChildren } from "hono/jsx";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="shortcut icon" href="/public/favicon.png" type="image/png" />
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
};
