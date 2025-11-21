import type { Context } from "hono";
import { WEBHOOK_SECRET } from "../lib/constants";
import { syncContent } from "../lib/sync";

export const webhookHandler = async (c: Context) => {
	const signature = c.req.header("x-webhook-signature") || "";
	const body = await c.req.text();

	if (signature !== WEBHOOK_SECRET) {
		return c.text("Unauthorized", 401);
	}

	console.log("Received webhook payload:", body);

	try {
		await syncContent();
	} catch {
		return c.text("Git operation failed", 500);
	}

	return c.text("Webhook received and processed", 200);
};
