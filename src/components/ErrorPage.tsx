import type { FC } from "hono/jsx";

interface ErrorPageProps {
	status: number;
	message: string;
}

export const ErrorPage: FC<ErrorPageProps> = ({ status, message }) => {
	const title =
		status === 404 ? "404 - Not Found" : `${status} - Internal Server Error`;

	return (
		<main class="center">
			<h1>{title}</h1>
			<pre>{message}</pre>
		</main>
	);
};
