import type { Context } from "hono";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { GIT_REPO_URL, WEBHOOK_SECRET } from "../lib/constants";

export const webhookHandler = async (c: Context) => {
	const signature = c.req.header("x-webhook-signature") || "";
	const body = await c.req.text();

	if (signature !== WEBHOOK_SECRET) {
		return c.text("Unauthorized", 401);
	}

	console.log("Received webhook payload:", body);

	if (!GIT_REPO_URL) {
		console.error("GIT_REPO_URL is not set");
		return c.text("Configuration error", 500);
	}

	const dataDir = join(process.cwd(), "data");

	if (!existsSync(dataDir)) {
		mkdirSync(dataDir, { recursive: true });
	}

	const isGitRepo = existsSync(join(dataDir, ".git"));

	try {
		if (isGitRepo) {
			console.log("Pulling changes...");
			const proc = Bun.spawn(["git", "pull"], {
				cwd: dataDir,
				stdout: "inherit",
				stderr: "inherit",
			});
			await proc.exited;
			if (proc.exitCode !== 0) {
				throw new Error("Git pull failed");
			}
		} else {
			console.log("Cloning repository...");
			// Clone into the current directory (dataDir)
			const proc = Bun.spawn(["git", "clone", GIT_REPO_URL, "."], {
				cwd: dataDir,
				stdout: "inherit",
				stderr: "inherit",
			});
			await proc.exited;
			if (proc.exitCode !== 0) {
				throw new Error("Git clone failed");
			}
		}
	} catch (error) {
		console.error("Git operation failed:", error);
		return c.text("Git operation failed", 500);
	}

	return c.text("Webhook received and processed", 200);
};
