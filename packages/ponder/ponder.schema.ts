import { onchainTable } from "ponder";

export const greeting = onchainTable("greeting", (t) => ({
  id: t.text().primaryKey(),
  text: t.text().notNull(),
  setterId: t.hex().notNull(),
  premium: t.boolean().notNull(),
  value: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
}));

export const job = onchainTable("job", (t) => ({
  jobId: t.bigint().notNull().primaryKey(), // Unique identifier for the job
  freelancer: t.hex(),        // Optional (nullable)
  client: t.hex(),            // Optional (nullable)
  payment: t.bigint(),        // Optional (nullable)
  title: t.text(),            // Optional (nullable)
  description: t.text(),      // Optional (nullable)
  category: t.text(),         // Optional (nullable)
  estimatedDuration: t.bigint(),  // Optional (nullable)
  createdAt: t.bigint(),      // Optional (nullable)
  acceptedAt: t.bigint(),     // Optional (nullable)
  deadline: t.bigint(),       // Optional (nullable)
  completedAt: t.bigint(),    // Optional (nullable)
  cancelledAt: t.bigint(),    // Optional (nullable)
}));

export const confirmation = onchainTable("confirmation", (t) => ({
  id: t.text().primaryKey(),      // Unique: jobId + confirmer
  jobId: t.bigint().notNull(),
  confirmer: t.hex().notNull(),
  isClient: t.boolean().notNull(),
  timestamp: t.bigint().notNull(),
}));