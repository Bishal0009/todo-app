import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { WebhookEvent } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { Webhook } from "svix";
import { ca } from "zod/v4/locales";

const webhookSecret: string = process.env.CLERK_WEBHOOK_SIGNING_SECRET!;

export async function POST(req: NextRequest) {
  // verify the webhook with svix
  const svix_id = req.headers.get("svix-id") ?? "";
  const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
  const svix_signature = req.headers.get("svix-signature") ?? "";

  const body = await req.text();

  const sivx = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  try {
    evt = sivx.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Bad Request", { status: 400 });
  }

  // Handle the webhook event

  const { id } = evt.data;
  const eventType = evt.type;
  // console.log(`Received webhook with ID ${id} and event type of ${eventType}`);
  // console.log("Webhook payload:", evt.data);

  try {
    if (evt.type === "user.created") {
      // console.log("userId:", evt.data.id);

      const name = evt.data.username
        ? evt.data.username
        : evt.data.first_name + " " + evt.data.last_name;
      const imageUrl = evt.data.image_url;
      const clerkId = evt.data.id;

      // Insert the new user into the database
      const result = await db
        .insert(usersTable)
        .values({
          clerkId: clerkId,
          name: name,
          imageUrl: imageUrl,
        })
        .returning();

      console.log("Inserted new user with ID:", result);
    }

    if (evt.type === "user.deleted") {
      const clerkId = evt.data.id;

      if (!clerkId) {
        console.error(
          "No clerkId found in webhook data for user.deleted event."
        );
        return new Response("Bad Request", { status: 400 });
      }

      // Delete the user from the database
      const result = await db
        .delete(usersTable)
        .where(eq(usersTable.clerkId, clerkId));

      console.log("Deleted user with clerkId:", clerkId);
    }

    if (evt.type === "user.updated") {
      const clerkId = evt.data.id;
      const name = evt.data.username
        ? evt.data.username
        : evt.data.first_name + " " + evt.data.last_name;
      const imageUrl = evt.data.image_url;

      const result = await db
        .update(usersTable)
        .set({
          name: name,
          imageUrl: imageUrl,
        })
        .where(eq(usersTable.clerkId, clerkId));

      console.log("Updated user with clerkId:", result);
    }
  } catch (error) {
    console.error("Error processing database operation:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response("Webhook received.", { status: 200 });
}
