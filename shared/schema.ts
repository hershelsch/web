// This file defines the data schemas - keeping as .ts for frontend type safety
import { pgTable, text, serial, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'google-search', 'webpage-capture', 'video-download'
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  input: json("input").notNull(), // Store the input parameters
  outputPath: text("output_path"), // Path to the generated ZIP file
  error: text("error"), // Error message if failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  type: true,
  input: true,
});

export const googleSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

export const webpageCaptureSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export const videoDownloadSchema = z.object({
  url: z.string().url("Please enter a valid video URL"),
  quality: z.string().default("best"),
  format: z.string().default("mp4"),
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type GoogleSearchInput = z.infer<typeof googleSearchSchema>;
export type WebpageCaptureInput = z.infer<typeof webpageCaptureSchema>;
export type VideoDownloadInput = z.infer<typeof videoDownloadSchema>;

// Keep existing user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
