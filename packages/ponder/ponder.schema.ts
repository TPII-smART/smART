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
export const job = onchainTable(
	"job",
	(t) => ({
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
	})
);

// Gigs table
export const gig = onchainTable("gig", (t) => ({
	gigId: t.bigint().primaryKey(),
	client: t.hex().notNull(),
	acceptedFreelancer: t.hex(),
	maxPayment: t.bigint().notNull(),
	finalPayment: t.bigint(),
	title: t.text().notNull(),
	description: t.text().notNull(),
	category: t.text().notNull(),
	maxDurationInHours: t.bigint().notNull(),
	finalDurationInHours: t.bigint(),
	deadline: t.bigint(),
	state: t.integer().notNull(),
	createdAt: t.bigint().notNull(),
	acceptedAt: t.bigint(),
	clientReceived: t.boolean().notNull(),
	freelancerDelivered: t.boolean().notNull(),
	acceptedApplicationId: t.bigint(),
}));

// Gig Applications table
export const gigApplication = onchainTable(
	"gigApplication",
	(t) => ({
		applicationId: t.bigint().notNull(),
		gigId: t.bigint().notNull(),
		freelancer: t.hex().notNull(),
		proposedPayment: t.bigint().notNull(),
		proposedDurationInHours: t.bigint().notNull(),
		state: t.integer().notNull(),
		createdAt: t.bigint().notNull(),
		proposalComment: t.text().notNull(),
		rejectionComment: t.text(),
	}),
	(table) => ({
		pk: primaryKey({ columns: [table.applicationId, table.gigId] }),
	})
);

export const userProfile = onchainTable(
	"userProfile",
	(t) => ({
		address: t.text().notNull(),
		username: t.varchar({ length: 64 }),
		biography: t.varchar({ length: 512 }),
		email: t.varchar({ length: 128 }),
		profilePicture: t.varchar({ length: 1024 }),
		bannerPicture: t.varchar({ length: 1024 }),
		xUrl: t.varchar({ length: 256 }),
		instagramUrl: t.varchar({ length: 256 }),
		linkedinUrl: t.varchar({ length: 256 }),
		artstationUrl: t.varchar({ length: 256 }),
		sketchfabUrl: t.varchar({ length: 256 }),
		customUrl: t.varchar({ length: 256 }),
	}),
	(table) => ({
		pk: primaryKey({ columns: [table.address] }),
	})
);
