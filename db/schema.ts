import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull().unique(),
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]
);

export const statusEnum = pgEnum("status_enum", [
  "active",
  "completed",
  "archived",
]);

export const priorityEnum = pgEnum("priority_enum", ["low", "medium", "high"]);

export const todosTable = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  notes: text("notes"),
  status: statusEnum("status").notNull().default("active"),
  priority: priorityEnum("priority").notNull().default("medium"),
  dueAt: timestamp("due_at"),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelation = relations(usersTable, ({ many }) => ({
  todos: many(todosTable),
}));

export const todosRelation = relations(todosTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [todosTable.userId],
    references: [usersTable.id],
  }),
}));
