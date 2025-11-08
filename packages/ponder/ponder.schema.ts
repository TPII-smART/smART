import { table } from "console";
import { desc, onchainTable, primaryKey, timestamp } from "ponder";
import { title } from "process";

// Talent table
export const talent = onchainTable("talent", (t) => ({
	talentId: t.bigint().primaryKey(),
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

// HiredTalent table
export const hiredTalent = onchainTable(
	"hiredTalent",
	(t) => ({
		hiredTalentId: t.bigint().notNull(),
		talentId: t.bigint().notNull(),
		client: t.varchar({ length: 128 }).notNull(),
		freelancer: t.varchar({ length: 128 }).notNull(),
		payment: t.bigint().notNull(),
		title: t.varchar({ length: 64 }).notNull(),
		description: t.varchar({ length: 512 }).notNull(),
		category: t.varchar({ length: 64 }).notNull(),
		bannerImageHash: t.varchar({ length: 128 }).notNull(),
		hiredTalentDuration: t.bigint().notNull(),
		deadline: t.bigint(),
		state: t.integer().notNull(),
		createdAt: t.bigint().notNull(),
		acceptedAt: t.bigint(),
		finishedAt: t.bigint(), // When the hiredTalent was finished
		canceledAt: t.bigint(), // When the hiredTalent was canceled
		deliveredAt: t.bigint(), // When the hiredTalent was delivered
		rejectedAt: t.bigint(), // When the hiredTalent was rejected by the client
		disputedAt: t.bigint(), // When the hiredTalent was disputed
		emitBy: t.varchar({ length: 128 }),
		rating: t.integer(), // Rating given by the client to the freelancer
		clientReceived: t.boolean().notNull(),
		clientRejected: t.boolean().notNull(),
		clientCancelled: t.boolean().notNull(),
		freelancerCancelled: t.boolean().notNull(),
		freelancerDelivered: t.boolean().notNull(),
		freelancerUploaded: t.boolean().notNull().default(false),
		disputeId: t.bigint(),
		lastTransactionHash: t.varchar({ length: 256 }).notNull(),
	}),
	(table) => ({
		pk: primaryKey({ columns: [table.hiredTalentId, table.talentId] }),
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
	deliveredAt: t.bigint(), // When the hiredTalent was delivered
	rejectedAt: t.bigint(), // When the hiredTalent was rejected by the client
	disputedAt: t.bigint(), // When the hiredTalent was disputed
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
	disputeId: t.bigint(),
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


export const hiredTalentDeliverable = onchainTable(
  "hiredTalentDeliverable",
  t => ({
    hiredTalentId: t.bigint().notNull(),
    talentId: t.bigint().notNull(),
    resource: t.varchar({ length: 256 }).notNull(),
    submissionComment: t.varchar({ length: 512 }),
    uploadedAt: t.bigint().notNull(),
    clientResponse: t.varchar({ length: 512 }),
	responseTimestamp: t.bigint(),
	state: t.integer().notNull(),
    lastTransactionHash: t.varchar({ length: 256 }).notNull(),
  }),
  table => ({
    pk: primaryKey({ columns: [table.hiredTalentId, table.talentId, table.uploadedAt] }),
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
	responseTimestamp: t.bigint(),
	state: t.integer().notNull(),
    lastTransactionHash: t.varchar({ length: 256 }).notNull(),
  }),
  table => ({
    pk: primaryKey({ columns: [table.gigId, table.uploadedAt] }),
  })
);


export const dispute = onchainTable("disputes", (t) => ({
		disputeId: t.bigint().notNull(),
		klerosDisputeId: t.bigint(),
		type: t.varchar({ length: 16 }).notNull(), // "hiredTalent" | "gig"
		raiseOnKleros: t.boolean().notNull().default(false),
		freelancerPaidArbitrationFee: t.boolean(),
		clientPaidArbitrationFee: t.boolean(),
		freelancerFunds: t.bigint(),
		clientFunds: t.bigint(),
		freelancerFee: t.bigint(),
		clientFee: t.bigint(),
		roundDeadline: t.bigint().notNull(),
		currentRound: t.integer(),
		currentRuling: t.integer(),
		appealCost: t.bigint(),	
		status: t.integer().default(0),
		disputeFinished: t.boolean().notNull().default(false),
		isAppealed: t.boolean().notNull().default(false),
		disputeReason: t.varchar({ length: 256 }),
		title: t.varchar({ length: 128 }),
		description: t.varchar({ length: 512 }),
		timesDismissed: t.integer().notNull().default(0),
		currentlyDismissed: t.boolean().notNull().default(false),
		lastTransactionHash: t.varchar({ length: 256 }).notNull(),

}),
table => ({
	pk: primaryKey({ columns: [table.disputeId] }),
})
);

export const klerosDispute = onchainTable("klerosdisputes", (t) => ({
		klerosDisputeId: t.bigint().notNull(),
		disputeId: t.bigint().notNull(),
		lastTransactionHash: t.varchar({ length: 256 }).notNull(),
}),
table => ({
	pk: primaryKey({ columns: [table.klerosDisputeId] }),
})
);

export const disputeContributor = onchainTable("disputeContributors", (t) => ({
		disputeId: t.bigint().notNull(),
		contributor: t.varchar({ length: 128 }).notNull(),
		lastTransactionHash: t.varchar({ length: 256 }).notNull(),
}),
table => ({
	pk: primaryKey({ columns: [table.disputeId, table.contributor] }),
})
);