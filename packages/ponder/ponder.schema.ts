import { onchainTable, primaryKey } from "ponder";
import { emit } from "process";

// JobPosting table
export const jobPosting = onchainTable("jobPosting", (t) => ({
	postingId: t.bigint().primaryKey(),
	freelancer: t.varchar({ length: 128 }).notNull(),
	basePayment: t.bigint().notNull(),
	title: t.varchar({ length: 64 }).notNull(),
	description: t.varchar({ length: 512 }).notNull(),
	category: t.varchar({ length: 64 }).notNull(),
	bannerImageHash: t.varchar({ length: 128 }).notNull(), // Optional, can be null if not provided
	minimumNoticeTime: t.bigint().notNull(),
	averageWorkDuration: t.bigint().notNull(),
	createdAt: t.bigint().notNull(),
	lastTransactionHash: t.varchar({ length: 256 }).notNull(),
}));

// Job table
export const job = onchainTable(
	"job",
	(t) => ({
		jobId: t.bigint().notNull(),
		postingId: t.bigint().notNull(),
		client: t.varchar({ length: 128 }).notNull(),
		freelancer: t.varchar({ length: 128 }).notNull(),
		payment: t.bigint().notNull(),
		title: t.varchar({ length: 64 }).notNull(),
		description: t.varchar({ length: 512 }).notNull(),
		category: t.varchar({ length: 64 }).notNull(),
		bannerImageHash: t.varchar({ length: 128 }).notNull(),
		jobDuration: t.bigint().notNull(),
		deadline: t.bigint(),
		state: t.integer().notNull(),
		createdAt: t.bigint().notNull(),
		acceptedAt: t.bigint(),
		finishedAt: t.bigint(), // When the job was finished
		canceledAt: t.bigint(), // When the job was canceled
		deliveredAt: t.bigint(), // When the job was delivered
		emitBy: t.varchar({ length: 128 }),
		clientReceived: t.boolean().notNull(),
		freelancerDelivered: t.boolean().notNull(),
		lastTransactionHash: t.varchar({ length: 256 }).notNull(),
	}),
	(table) => ({
		pk: primaryKey({ columns: [table.jobId, table.postingId] }),
	})
);

// Gigs table
export const gig = onchainTable("gig", (t) => ({
	gigId: t.bigint().primaryKey(),
	client: t.varchar({ length: 128 }).notNull(),
	acceptedFreelancer: t.varchar({ length: 128 }),
	basePayment: t.bigint().notNull(),
	finalPayment: t.bigint(),
	title: t.varchar({ length: 64 }).notNull(),
	description: t.varchar({ length: 512 }).notNull(),
	category: t.varchar({ length: 64 }).notNull(),
	maxDurationInHours: t.bigint().notNull(),
	finalDurationInHours: t.bigint(),
	deadline: t.bigint(),
	state: t.integer().notNull(),
	createdAt: t.bigint().notNull(),
	acceptedAt: t.bigint(),
	finishedAt: t.bigint(),
	canceledAt: t.bigint(),
	deliveredAt: t.bigint(), // When the job was delivered
	emitBy: t.varchar({ length: 128 }),
	clientReceived: t.boolean().notNull(),
	freelancerDelivered: t.boolean().notNull(),
	acceptedApplicationId: t.bigint(),
	gigBannerImageHash: t.varchar({ length: 128 }),
	lastTransactionHash: t.varchar({ length: 256 }).notNull(),
}));

// Gig Applications table
export const gigApplication = onchainTable(
	"gigApplication",
	(t) => ({
		applicationId: t.bigint().notNull(),
		gigId: t.bigint().notNull(),
		freelancer: t.varchar({ length: 128 }).notNull(),
		proposedPayment: t.bigint().notNull(),
		proposedDurationInHours: t.bigint().notNull(),
		state: t.integer().notNull(),
		createdAt: t.bigint().notNull(),
		rejectAt: t.bigint(),
		emitBy: t.varchar({ length: 128 }).notNull(),
		proposalComment: t.varchar({ length: 512 }).notNull(),
		rejectionComment: t.varchar({ length: 512 }),
		lastTransactionHash: t.varchar({ length: 256 }).notNull(),
	}),
	(table) => ({
		pk: primaryKey({ columns: [table.applicationId, table.gigId] }),
	})
);

export const userProfile = onchainTable(
	"userProfile",
	(t) => ({
		address: t.varchar({ length: 128 }).notNull(),
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
		lastTransactionHash: t.varchar({ length: 256 }).notNull(),
	}),
	(table) => ({
		pk: primaryKey({ columns: [table.address] }),
	})
);
