import { onchainTable, primaryKey } from "ponder";

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

// Job table
export const job = onchainTable("job", (t) => ({
  jobId: t.bigint().notNull(),
  postingId: t.bigint().notNull(),
  client: t.hex().notNull(),
  freelancer: t.hex().notNull(),
  payment: t.bigint().notNull(),
  title: t.text().notNull(),
  description: t.text().notNull(),
  category: t.text().notNull(),
  bannerImageUrl: t.text().notNull(),
  jobDuration: t.bigint().notNull(),
  deadline: t.bigint(),
  state: t.integer().notNull(),
  createdAt: t.bigint().notNull(),
  acceptedAt: t.bigint(),
  clientReceived: t.boolean().notNull(),
  freelancerDelivered: t.boolean().notNull(),
}),
 (table) => ({
  pk: primaryKey({ columns: [table.jobId, table.postingId] }),
}));

