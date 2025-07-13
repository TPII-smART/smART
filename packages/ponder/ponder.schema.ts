import { onchainTable } from "ponder";

// JobPosting table
export const jobPosting = onchainTable("jobPosting", (t) => ({
  postingId: t.bigint().primaryKey(),
  freelancer: t.hex().notNull(),
  basePayment: t.bigint().notNull(),
  title: t.text().notNull(),
  description: t.text().notNull(),
  category: t.text().notNull(),
  bannerImageUrl: t.text().notNull(), // Optional, can be null if not provided
  minimumNoticeTime: t.bigint().notNull(),
  averageWorkDuration: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
}));

// Job table (references JobPosting)
export const job = onchainTable("job", (t) => ({
  jobId: t.bigint().primaryKey(),
  postingId: t.bigint().notNull(), // Foreign key to JobPosting
  client: t.hex().notNull(),
  freelancer: t.hex().notNull(),
  payment: t.bigint().notNull(),
  title: t.text().notNull(),
  description: t.text().notNull(),
  category: t.text().notNull(),
  bannerImageUrl: t.text().notNull(), // Optional, can be null if not provided
  jobDuration: t.bigint().notNull(),
  deadline: t.bigint(),
  state: t.integer().notNull(), // Enum: 0=WaitingForApproval, 1=Ongoing, etc.
  createdAt: t.bigint().notNull(),
  acceptedAt: t.bigint(),
  clientReceived: t.boolean().notNull(),
  freelancerDelivered: t.boolean().notNull(),
}));
