import { ponder } from "ponder:registry";
import {
	hiredTalent,
	talent,
	notification,
	hiredTalentDeliverable,
} from "ponder:schema";
import { HiredTalentState } from "@se-2/common";

// Event handlers for the HiredTalentsContract

// Talent handlers
// -------------------------------------------------------------
// This event is triggered when a new talent is created.
ponder.on("HiredTalentsContract:TalentCreated", async ({ event, context }) => {
	// Creates a new Talent
	await context.db.insert(talent).values({
		talentId: event.args.talentId,
		freelancer: event.args.freelancer || null,
		basePayment: event.args.basePayment || null,
		title: event.args.title || "",
		description: event.args.description || "",
		category: event.args.category || "",
		bannerImageHash: event.args.bannerImageHash || "",
		minimumNoticeTime: event.args.minimumNoticeTime || 0n,
		averageWorkDuration: event.args.averageWorkDuration || 0n,
		createdAt: BigInt(event.block.timestamp),
		lastTransactionHash: event.transaction.hash,
	});
});

// HiredTalent handlers
// -------------------------------------------------------------
// This event is triggered when a new hiredTalent is created.
ponder.on(
	"HiredTalentsContract:HiredTalentCreated",
	async ({ event, context }) => {
		// Creates a new HiredTalent
		await context.db.insert(hiredTalent).values({
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
			client: event.args.client || null,
			freelancer: event.args.freelancer || null,
			payment: event.args.payment || null,
			title: event.args.title || null,
			description: event.args.description || null,
			category: event.args.category || null,
			bannerImageHash: event.args.bannerImageHash || "",
			hiredTalentDuration: event.args.hiredTalentDuration || null,
			deadline: 0n, // Placeholder for deadline, will be updated on confirmation
			state: HiredTalentState.WaitingForApproval, // Initial hiredTalent state
			createdAt: BigInt(event.block.timestamp),
			acceptedAt: null,
			rejectedAt: null,
			emitBy: event.transaction.from,
			clientReceived: false,
			freelancerDelivered: false,
			clientRejected: false,
			clientCancelled: false,
			freelancerCancelled: false,
			lastTransactionHash: event.transaction.hash,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: event.args.freelancer as unknown as string,
			title: "A client want to hire you",
			message: `A client want to hire you for your talent "${event.args.title}"`,
			href: `/talents/${event.args.talentId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.hiredTalentId,
		});
	}
);

// This event is triggered when a hiredTalent is accepted by a freelancer.
ponder.on(
	"HiredTalentsContract:HiredTalentAccepted",
	async ({ event, context }) => {
		// Updates the hiredTalent with the acceptedAt timestamp
		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				client: event.args.client || null,
				acceptedAt: BigInt(event.block.timestamp),
				state: HiredTalentState.Ongoing,
				deadline: event.args.deadline || 0n,
				lastTransactionHash: event.transaction.hash,
				emitBy: event.transaction.from,
			});

		const _hiredTalent = await context.db.find(hiredTalent, {
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: event.args.client as unknown as string,
			title: "A hire was accepted by a freelancer",
			message: `The freelancer accepted the hire "${_hiredTalent?.title}"`,
			href: `/talents/${event.args.talentId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.hiredTalentId,
		});
	}
);

// This event is triggered when a hiredTalent is marked as completed by a freelancer.
ponder.on(
	"HiredTalentsContract:FreelancerMarkedAsDelivered",
	async ({ event, context }) => {
		// Updates the hiredTalent to mark it as delivered by the freelancer
		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				freelancerDelivered: true,
				emitBy: event.transaction.from,
				deliveredAt: BigInt(event.args.timestamp),
				lastTransactionHash: event.transaction.hash,
			});

		const _hiredTalent = await context.db.find(hiredTalent, {
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: event.args.client as unknown as string,
			title: "The freelancer marked a hire as delivered",
			message: `The freelancer marked the hire "${_hiredTalent?.title}" as delivered`,
			href: `/talents/${event.args.talentId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.hiredTalentId,
		});
	}
);

ponder.on(
	"HiredTalentsContract:DeliverableUploaded",
	async ({ event, context }) => {
		// Updates the hiredTalent to mark it as deliverable uploaded
		await context.db.insert(hiredTalentDeliverable).values({
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
			resource: event.args.resource,
			submissionComment: event.args.submissionComment,
			isLink: event.args.isLink,
			uploadedAt: BigInt(event.block.timestamp),
			lastTransactionHash: event.transaction.hash,
		});

		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				freelancerUploaded: true,
				lastTransactionHash: event.transaction.hash,
			});
	}
);

// This event is triggered when a a client add a comment to the uploaded deliverable.
ponder.on("HiredTalentsContract:CommentAdded", async ({ event, context }) => {
	// Updates the hiredTalent to mark it as deliverable uploaded
	await context.db
		.update(hiredTalentDeliverable, {
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
			uploadedAt: BigInt(event.args.deliverableUploadedAt),
		})
		.set({
			clientResponse: event.args.response,
			lastTransactionHash: event.transaction.hash,
		});
});

// This event is triggered when a hiredTalent is marked as received by the client.
ponder.on(
	"HiredTalentsContract:ClientMarkedAsReceived",
	async ({ event, context }) => {
		// Updates the hiredTalent to mark it as received by the client
		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				clientReceived: true,
				emitBy: event.transaction.from,
				lastTransactionHash: event.transaction.hash,
			});

		const _hiredTalent = await context.db.find(hiredTalent, {
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: event.args.client as unknown as string,
			title: "The client marked your hire as received",
			message: `The client marked your hire "${_hiredTalent?.title}" as received`,
			href: `/talents/${event.args.talentId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.hiredTalentId,
		});
	}
);

// This event is triggered when a hiredTalent is marked as finished.
ponder.on(
	"HiredTalentsContract:HiredTalentFinished",
	async ({ event, context }) => {
		// Updates the hiredTalent to mark it as finished
		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				state: HiredTalentState.Finished,
				finishedAt: BigInt(event.args.timestamp),
				emitBy: event.transaction.from,
				lastTransactionHash: event.transaction.hash,
			});
	}
);

// This event is triggered when a hiredTalent is rated.
ponder.on(
	"HiredTalentsContract:HiredTalentRated",
	async ({ event, context }) => {
		// Updates the hiredTalent to add the rating
		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				rating: event.args.rating || 0n,
				lastTransactionHash: event.transaction.hash,
			});

		const _hiredTalent = await context.db.find(hiredTalent, {
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: _hiredTalent?.freelancer as unknown as string,
			title: "The client rated your hire",
			message: `Your hire "${_hiredTalent?.title}" was rated with ${
				event.args.rating || 0n
			} ⭐`,
			href: `/talents/${event.args.talentId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.hiredTalentId,
		});
	}
);

// This event is triggered when a hiredTalent is cancelled.
ponder.on(
	"HiredTalentsContract:HiredTalentCancelled",
	async ({ event, context }) => {
		// Updates the hiredTalent to mark it as cancelled

		console.log("Cancelling hiredTalent from:", event.transaction.from);
		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				state: event.args.state,
				clientCancelled: event.args.clientCancelled,
				freelancerCancelled: event.args.freelancerCancelled,
				canceledAt: BigInt(event.args.timestamp),
				emitBy: event.transaction.from,
				lastTransactionHash: event.transaction.hash,
			});

		const _hiredTalent = await context.db.find(hiredTalent, {
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
		});

		if (event.args.freelancerCancelled && event.args.clientCancelled) {
			await context.db.insert(notification).values({
				id: `${event.block.number}-${event.log.logIndex}`,
				user: _hiredTalent?.freelancer as unknown as string,
				title: "The hire was cancelled",
				message: `The hire "${_hiredTalent?.title}" has been cancelled.`,
				href: `/talents/${event.args.talentId}`,
				createdAt: BigInt(event.block.timestamp),
				itemId: event.args.hiredTalentId,
			});

			await context.db.insert(notification).values({
				id: `${event.block.number}-${event.log.logIndex}`,
				user: _hiredTalent?.client as unknown as string,
				title: "The hire was cancelled",
				message: `The hire "${_hiredTalent?.title}" has been cancelled.`,
				href: `/talents/${event.args.talentId}`,
				createdAt: BigInt(event.block.timestamp),
				itemId: event.args.hiredTalentId,
			});
		} else if (event.args.clientCancelled) {
			await context.db.insert(notification).values({
				id: `${event.block.number}-${event.log.logIndex}`,
				user: _hiredTalent?.freelancer as unknown as string,
				title: "The hire was cancelled by the client",
				message: `The client for hire "${_hiredTalent?.title}" wants to cancel it.`,
				href: `/talents/${event.args.talentId}`,
				createdAt: BigInt(event.block.timestamp),
				itemId: event.args.hiredTalentId,
			});
		} else if (event.args.freelancerCancelled) {
			await context.db.insert(notification).values({
				id: `${event.block.number}-${event.log.logIndex}`,
				user: _hiredTalent?.client as unknown as string,
				title: "The hire was cancelled by the freelancer",
				message: `The freelancer for hire "${_hiredTalent?.title}" wants to cancel it.`,
				href: `/talents/${event.args.talentId}`,
				createdAt: BigInt(event.block.timestamp),
				itemId: event.args.hiredTalentId,
			});
		}
	}
);

ponder.on(
	"HiredTalentsContract:HiredTalentRejected",
	async ({ event, context }) => {
		// Updates the hiredTalent to mark it as cancelled

		await context.db
			.update(hiredTalent, {
				hiredTalentId: event.args.hiredTalentId,
				talentId: event.args.talentId,
			})
			.set({
				rejectedAt: BigInt(event.args.timestamp),
				clientReceived: event.args.clientReceived,
				freelancerDelivered: event.args.freelancerDelivered,
				clientRejected: event.args.clientRejected,
				emitBy: event.transaction.from,
				freelancerUploaded: event.args.freelancerUploaded,
				lastTransactionHash: event.transaction.hash,
			});

		const _hiredTalent = await context.db.find(hiredTalent, {
			hiredTalentId: event.args.hiredTalentId,
			talentId: event.args.talentId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: _hiredTalent?.freelancer as unknown as string,
			title: "Hired talent rejected",
			message: `The hire "${_hiredTalent?.title}" has been rejected by the client.`,
			href: `/talents/${event.args.hiredTalentId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.hiredTalentId,
		});
	}
);
