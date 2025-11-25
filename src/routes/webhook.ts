import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { WEBHOOK_SECRET } from "../lib/constants";
import { syncContent } from "../lib/sync";

export const webhookHandler = async (c: Context) => {
	const signature = c.req.header("x-hub-signature-256") || "";
	const body = await c.req.text();

	if (!WEBHOOK_SECRET) {
		console.error("WEBHOOK_SECRET is not set");
		return c.text("Configuration error", 500);
	}

	const hmac = createHmac("sha256", WEBHOOK_SECRET);
	const digest = Buffer.from(
		`sha256=${hmac.update(body).digest("hex")}`,
		"utf8",
	);
	const checksum = Buffer.from(signature, "utf8");

	if (checksum.length !== digest.length || !timingSafeEqual(digest, checksum)) {
		return c.text("Unauthorized", 401);
	}

	console.log("Received webhook payload");

	try {
		await syncContent();
	} catch {
		return c.text("Git operation failed", 500);
	}

	return c.text("Webhook received and processed", 200);
};
