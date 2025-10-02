import { onchainTable, primaryKey } from "ponder";

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
		rejectedAt: t.bigint(), // When the job was rejected by the client
		emitBy: t.varchar({ length: 128 }),
		rating: t.integer(), // Rating given by the client to the freelancer
		clientReceived: t.boolean().notNull(),
		clientRejected: t.boolean().notNull(),
		clientCancelled: t.boolean().notNull(),
		freelancerCancelled: t.boolean().notNull(),
		freelancerDelivered: t.boolean().notNull(),
		disputeQuestionId: t.varchar({ length: 256 }), // Question ID from Reality.eth if a dispute was created
		freelancerUploaded: t.boolean().notNull().default(false),
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
	rejectedAt: t.bigint(), // When the job was rejected by the client
	emitBy: t.varchar({ length: 128 }),
	clientReceived: t.boolean().notNull(),
	freelancerDelivered: t.boolean().notNull(),
	clientCancelled: t.boolean().notNull(),
	freelancerCancelled: t.boolean().notNull(),
	freelancerUploaded: t.boolean().notNull(),
	clientRejected: t.boolean().notNull(),
	rating: t.integer(), // Rating given by the client to the freelancer
	acceptedApplicationId: t.bigint(),
	gigBannerImageHash: t.varchar({ length: 128 }),
	disputeQuestionId: t.varchar({ length: 256 }), // Question ID from Reality.eth if a dispute was created
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

export const notification = onchainTable(
	"notification",
	(t) => ({
		id: t.text().notNull(),
		user: t.varchar({ length: 128 }).notNull(),
		title: t.varchar({ length: 64 }).notNull(),
		message: t.varchar({ length: 512 }).notNull(),
		itemId: t.bigint(),
		href: t.varchar({ length: 256 }),
		createdAt: t.bigint().notNull(),
		status: t.integer().notNull().default(0), // 0 = UNREAD, 1 = READ, 2 = DONE
		lastTransactionHash: t.varchar({ length: 256 }),
	}),
	(table) => ({
		pk: primaryKey({ columns: [table.id, table.user] }),
	})
);


export const jobDeliverable = onchainTable(
  "jobDeliverable",
  t => ({
    jobId: t.bigint().notNull(),
    postingId: t.bigint().notNull(),
    resource: t.varchar({ length: 256 }).notNull(),
    uploadedAt: t.bigint().notNull(),
    submissionComment: t.varchar({ length: 512 }),
    clientResponse: t.varchar({ length: 512 }),
    isLink: t.boolean().notNull(),
    lastTransactionHash: t.varchar({ length: 256 }).notNull(),
  }),
  table => ({
    pk: primaryKey({ columns: [table.jobId, table.postingId, table.uploadedAt] }),
  })
);

export const gigDeliverable = onchainTable(
  "gigDeliverables",
  t => ({
    gigId: t.bigint().notNull(),
    resource: t.varchar({ length: 256 }).notNull(),
    uploadedAt: t.bigint().notNull(),
    submissionComment: t.varchar({ length: 512 }),
    clientResponse: t.varchar({ length: 512 }),
    isLink: t.boolean().notNull(),
    lastTransactionHash: t.varchar({ length: 256 }).notNull(),
  }),
  table => ({
    pk: primaryKey({ columns: [table.gigId, table.uploadedAt] }),
  })
);

