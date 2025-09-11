import { ponder } from "ponder:registry";
import { gig, gigApplication } from "ponder:schema";
import { GigState, ApplicationState } from "@se-2/common";

// Listen for Gig creation
ponder.on("GigsContract:GigCreated", async ({ event, context }) => {
	await context.db.insert(gig).values({
		gigId: event.args.gigId,
		client: event.args.client,
		basePayment: event.args.basePayment,
		title: event.args.title,
		description: event.args.description,
		category: event.args.category,
		maxDurationInHours: event.args.maxDurationInHours,
		createdAt: BigInt(event.block.timestamp),
		uploadedAt: null,
		state: GigState.Open,
		acceptedFreelancer: null,
		finalPayment: null,
		finalDurationInHours: null,
		deadline: null,
		acceptedAt: null,
		emitBy: event.transaction.from,
		clientReceived: false,
		clientRejected: false,
		freelancerDelivered: false,	
		clientCancelled: false,
		freelancerCancelled: false,
		acceptedApplicationId: null,
		isLink: false,
		gigBannerImageHash: event.args.gigBannerImageHash,
		lastTransactionHash: event.transaction.hash,
	});
});

// Listen for application submission
ponder.on("GigsContract:ApplicationSubmitted", async ({ event, context }) => {
	await context.db.insert(gigApplication).values({
		gigId: event.args.gigId,
		applicationId: event.args.applicationId,
		freelancer: event.args.freelancer,
		proposedPayment: event.args.proposedPayment,
		proposedDurationInHours: event.args.proposedDurationInHours,
		proposalComment: event.args.proposalComment,
		state: ApplicationState.Pending,
		createdAt: BigInt(event.block.timestamp),
		emitBy: event.transaction.from,
		rejectionComment: null,
		lastTransactionHash: event.transaction.hash,
	});
});

// Listen for application acceptance
ponder.on("GigsContract:ApplicationAccepted", async ({ event, context }) => {
	await context.db
		.update(gigApplication, {
			gigId: event.args.gigId,
			applicationId: event.args.applicationId,
		})
		.set({
			state: ApplicationState.Accepted,
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});

	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			state: GigState.InProgress,
			acceptedApplicationId: event.args.applicationId,
			acceptedFreelancer: event.args.freelancer,
			finalPayment: event.args.finalPayment,
			finalDurationInHours: event.args.finalDurationInHours,
			deadline: event.args.deadline,
			acceptedAt: BigInt(event.block.timestamp),
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});
});

// Listen for gigApplication rejection
ponder.on("GigsContract:ApplicationRejected", async ({ event, context }) => {
	const blockTimestamp = event.block.timestamp;

	await context.db
		.update(gigApplication, {
			gigId: event.args.gigId,
			applicationId: event.args.applicationId,
		})
		.set({
			state: ApplicationState.Rejected,
			rejectionComment: event.args.rejectionComment,
			lastTransactionHash: event.transaction.hash,
			emitBy: event.transaction.from,
			rejectAt: blockTimestamp,
		});

	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			lastTransactionHash: event.transaction.hash,
			emitBy: event.transaction.from,
		});
});

// Listen for freelancer delivery
ponder.on(
	"GigsContract:FreelancerMarkedAsDelivered",
	async ({ event, context }) => {
		await context.db
			.update(gig, {
				gigId: event.args.gigId,
			})
			.set({
				freelancerDelivered: true,
				lastTransactionHash: event.transaction.hash,
				emitBy: event.transaction.from,
				deliveredAt: event.args.timestamp,
			});
	}
);

// Listen for client reception
ponder.on("GigsContract:ClientMarkedAsReceived", async ({ event, context }) => {
	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			clientReceived: true,
			lastTransactionHash: event.transaction.hash,
			emitBy: event.transaction.from,
		});
});

// Listen for gig completion
ponder.on("GigsContract:GigCompleted", async ({ event, context }) => {
	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			state: GigState.Completed,
			finishedAt: event.args.timestamp,
			lastTransactionHash: event.transaction.hash,
			emitBy: event.transaction.from,
		});
});

// Listen for gig rating
ponder.on("GigsContract:GigRated", async ({ event, context }) => {
	// Updates the gig to add the rating
	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			rating: event.args.rating || 0n,
			lastTransactionHash: event.transaction.hash,
		});
});

// Listen for gig cancellation
ponder.on("GigsContract:GigCancelled", async ({ event, context }) => {
	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			state: event.args.state,
			clientCancelled: event.args.clientCancelled,
			freelancerCancelled: event.args.freelancerCancelled,
			canceledAt: event.args.timestamp,
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});
});

ponder.on("GigsContract:FileUploaded", async ({ event, context }) => {
	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			resource: event.args.resource,
			submissionComment: event.args.submissionComment,
			isLink: event.args.isLink,
			uploadedAt: BigInt(event.block.timestamp),
			lastTransactionHash: event.transaction.hash,
		});
});

// This event is triggered when a a client add a comment to the uploaded file.
ponder.on(
	"GigsContract:CommentAdded",
	async ({ event, context }) => {
		// Updates the gig to mark it as file uploaded
		await context.db
			.update(gig, {
				gigId: event.args.gigId,
			})
			.set({
				clientResponse: event.args.response,
				lastTransactionHash: event.transaction.hash,
			});
	}
);

ponder.on("GigsContract:GigRejected", async ({event, context}) => {
	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			clientReceived: event.args.clientReceived,
			freelancerDelivered: event.args.freelancerDelivered,
			clientRejected: event.args.clientRejected,
			rejectedAt: event.args.timestamp,
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});
});
