import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { GIT_REPO_URL } from "./constants";

export async function syncContent() {
	if (!GIT_REPO_URL) {
		console.error("GIT_REPO_URL is not set");
		throw new Error("GIT_REPO_URL is not set");
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
		throw error;
	}
}
