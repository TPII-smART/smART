import { ponder } from "ponder:registry";
import {
	gig,
	gigApplication,
	notification,
	gigDeliverable,
} from "ponder:schema";

export enum GigState {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4,
}

export enum ApplicationState {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Withdrawn = 3,
}

export enum DeliverableState {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Disputed = 3,
}

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
		freelancerUploaded: false,
		acceptedApplicationId: null,
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

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _gig?.client as unknown as string,
		title: "New Application Received",
		message: `New application submitted for your gig "${_gig?.title}"`,
		href: `/gig/${event.args.gigId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.applicationId,
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

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: event.args.freelancer,
		title: "Your application was accepted",
		message: `Your application for gig "${_gig?.title}" was accepted`,
		href: `/gig/${event.args.gigId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.applicationId,
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

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });
	const _app = await context.db.find(gigApplication, {
		gigId: event.args.gigId,
		applicationId: event.args.applicationId,
	});

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _app?.freelancer as unknown as string,
		title: "Your application was rejected",
		message: `Your application for gig "${_gig?.title}" was rejected`,
		href: `/gig/${event.args.gigId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.applicationId,
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

		const _gig = await context.db.find(gig, { gigId: event.args.gigId });

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: _gig?.client as unknown as string,
			title: "Hired freelancer marked gig as delivered",
			message: `Your gig "${_gig?.title}" has been marked as delivered by the freelancer.`,
			href: `/gig/${event.args.gigId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.applicationId,
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

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });


	await context.db
		.update(gigDeliverable, {
			gigId: event.args.gigId,
			uploadedAt: BigInt(event.args.deliverableUploadedAt),
		})
		.set({
			clientResponse: event.args.comment,
			state: DeliverableState.Approved,
			responseTimestamp: BigInt(event.args.timestamp),
			lastTransactionHash: event.transaction.hash,
		});

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _gig?.acceptedFreelancer as unknown as string,
		title: "Client marked gig as delivered",
		message: `Your work in "${_gig?.title}" has been marked as delivered by the client.`,
		href: `/gig/${event.args.gigId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.applicationId,
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

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _gig?.acceptedFreelancer as unknown as string,
		title: "A client rated your work",
		message: `Your work in "${
			_gig?.title
		}" has been rated by the client with ${event.args.rating || 0n} ⭐.`,
		href: `/gig/${event.args.gigId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.applicationId,
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

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });

	if (event.args.freelancerCancelled && event.args.clientCancelled) {
		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _gig?.acceptedFreelancer as unknown as string,
			title: "The application was cancelled",
			message: `The application for gig "${_gig?.title}" has been cancelled.`,
			href: `/gig/${event.args.gigId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.applicationId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _gig?.client as unknown as string,
			title: "The application was cancelled",
			message: `The application for gig "${_gig?.title}" has been cancelled.`,
			href: `/gig/${event.args.gigId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.applicationId,
		});
	} else if (event.args.clientCancelled) {
		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _gig?.acceptedFreelancer as unknown as string,
			title: "The application was cancelled by the client",
			message: `The client for gig "${_gig?.title}" wants to cancel it.`,
			href: `/gig/${event.args.gigId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.applicationId,
		});
	} else if (event.args.freelancerCancelled) {
		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _gig?.client as unknown as string,
			title: "The application was cancelled by the freelancer",
			message: `The freelancer for gig "${_gig?.title}" wants to cancel it.`,
			href: `/gig/${event.args.gigId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.applicationId,
		});
	}
});

ponder.on("GigsContract:DeliverableUploaded", async ({ event, context }) => {
	await context.db.insert(gigDeliverable).values({
		gigId: event.args.gigId,
		resource: event.args.resource,
		submissionComment: event.args.submissionComment,
		uploadedAt: BigInt(event.block.timestamp),
		state: DeliverableState.Pending,
		lastTransactionHash: event.transaction.hash,
	});

	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			freelancerUploaded: event.args.freelancerUploaded,
			lastTransactionHash: event.transaction.hash,
			emitBy: event.transaction.from,
		});
});


ponder.on("GigsContract:GigRejected", async ({ event, context }) => {
	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			clientReceived: event.args.clientReceived,
			freelancerDelivered: event.args.freelancerDelivered,
			clientRejected: event.args.clientRejected,
			rejectedAt: event.args.timestamp,
			freelancerUploaded: event.args.freelancerUploaded,
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});


	

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });

	await context.db
	.update(gigDeliverable, {
		gigId: event.args.gigId,
		uploadedAt: BigInt(event.args.deliverableUploadedAt),
	})
	.set({
		clientResponse: event.args.comment,
		state: DeliverableState.Rejected,
		responseTimestamp: BigInt(event.args.timestamp),
		lastTransactionHash: event.transaction.hash,
	});

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _gig?.acceptedFreelancer as unknown as string,
		title: "Gig application rejected",
		message: `The application for gig "${_gig?.title}" has been rejected by the client.`,
		href: `/gig/${event.args.gigId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.applicationId,
	});
});

ponder.on("GigsContract:ApplicationWithdrawn", async ({ event, context }) => {
	await context.db
		.update(gigApplication, {
			gigId: event.args.gigId,
			applicationId: event.args.applicationId,
		})
		.set({
			state: ApplicationState.Withdrawn,
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
			rejectAt: event.block.timestamp,
			rejectionComment: event.args.rejectionComment,
		});

	await context.db
		.update(gig, {
			gigId: event.args.gigId,
		})
		.set({
			lastTransactionHash: event.transaction.hash,
			emitBy: event.transaction.from,
		});

	const _gig = await context.db.find(gig, { gigId: event.args.gigId });

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _gig?.client as unknown as string,
		title: "An application was withdrawn",
		message: `The application for gig "${_gig?.title}" was withdrawn by the freelancer.`,
		href: `/gig/${event.args.gigId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.applicationId,
	});
});