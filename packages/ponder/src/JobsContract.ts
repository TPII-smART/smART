import { ponder } from "ponder:registry";
import { job, jobPosting, notification, jobDeliverable } from "ponder:schema";
import { JobState } from "@se-2/common";

// Event handlers for the JobsContract

// Job Posting handlers
// -------------------------------------------------------------
// This event is triggered when a new job posting is created.
ponder.on("JobsContract:JobPostingCreated", async ({ event, context }) => {
	// Creates a new Job Posting
	await context.db.insert(jobPosting).values({
		postingId: event.args.postingId,
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

// Job handlers
// -------------------------------------------------------------
// This event is triggered when a new job is created.
ponder.on("JobsContract:JobCreated", async ({ event, context }) => {
	// Creates a new Job
	await context.db.insert(job).values({
		jobId: event.args.jobId,
		postingId: event.args.postingId,
		client: event.args.client || null,
		freelancer: event.args.freelancer || null,
		payment: event.args.payment || null,
		title: event.args.title || null,
		description: event.args.description || null,
		category: event.args.category || null,
		bannerImageHash: event.args.bannerImageHash || "",
		jobDuration: event.args.jobDuration || null,
		deadline: 0n, // Placeholder for deadline, will be updated on confirmation
		state: JobState.WaitingForApproval, // Initial job state
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
		message: `A client want to hire you for the job "${event.args.title}"`,
		href: `/job-posting/${event.args.postingId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.jobId,
	});
});

// This event is triggered when a job is accepted by a freelancer.
ponder.on("JobsContract:JobAccepted", async ({ event, context }) => {
	// Updates the job with the acceptedAt timestamp
	await context.db
		.update(job, {
			jobId: event.args.jobId,
			postingId: event.args.postingId,
		})
		.set({
			client: event.args.client || null,
			acceptedAt: BigInt(event.block.timestamp),
			state: JobState.Ongoing,
			deadline: event.args.deadline || 0n,
			lastTransactionHash: event.transaction.hash,
			emitBy: event.transaction.from,
		});

	const _job = await context.db.find(job, {
		jobId: event.args.jobId,
		postingId: event.args.postingId,
	});

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: event.args.client as unknown as string,
		title: "A job was accepted by a freelancer",
		message: `The freelancer accepted the job "${_job?.title}"`,
		href: `/job-posting/${event.args.postingId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.jobId,
	});
});

// This event is triggered when a job is marked as completed by a freelancer.
ponder.on(
	"JobsContract:FreelancerMarkedAsDelivered",
	async ({ event, context }) => {
		// Updates the job to mark it as delivered by the freelancer
		await context.db
			.update(job, {
				jobId: event.args.jobId,
				postingId: event.args.postingId,
			})
			.set({
				freelancerDelivered: true,
				emitBy: event.transaction.from,
				deliveredAt: BigInt(event.args.timestamp),
				lastTransactionHash: event.transaction.hash,
			});

		const _job = await context.db.find(job, {
			jobId: event.args.jobId,
			postingId: event.args.postingId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
			user: event.args.client as unknown as string,
			title: "The freelancer marked a job as delivered",
			message: `The freelancer marked the job "${_job?.title}" as delivered`,
			href: `/job-posting/${event.args.postingId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.jobId,
		});
	}
);

ponder.on(
	"JobsContract:DeliverableUploaded",
	async ({ event, context }) => {
		// Updates the job to mark it as deliverable uploaded
		await context.db
			.insert(jobDeliverable)
			.values({
				jobId: event.args.jobId,
				postingId: event.args.postingId,
				resource: event.args.resource,	
				submissionComment: event.args.submissionComment,
				isLink: event.args.isLink,
				uploadedAt: BigInt(event.block.timestamp),
				lastTransactionHash: event.transaction.hash,
			});

		await context.db
			.update(job, {
				jobId: event.args.jobId,
				postingId: event.args.postingId,
			})
			.set({
				freelancerUploaded: true,
				lastTransactionHash: event.transaction.hash,
			});
	}
);


// This event is triggered when a job is marked as received by the client.
ponder.on("JobsContract:ClientMarkedAsReceived", async ({ event, context }) => {
	// Updates the job to mark it as received by the client
	await context.db
		.update(job, {
			jobId: event.args.jobId,
			postingId: event.args.postingId,
		})
		.set({
			clientReceived: true,
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});

	const _job = await context.db.find(job, {
		jobId: event.args.jobId,
		postingId: event.args.postingId,
	});

	await context.db.update(jobDeliverable, {
		jobId: event.args.jobId,
		postingId: event.args.postingId,
		uploadedAt: event.args.deliverableUploadedAt,
	}).set({
		clientResponse: event.args.comment,
		responseTimestamp: BigInt(event.args.timestamp),
		lastTransactionHash: event.transaction.hash,
	});

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: event.args.client as unknown as string,
		title: "The client marked your job as received",
		message: `The client marked your job "${_job?.title}" as received`,
		href: `/job-posting/${event.args.postingId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.jobId,
	});
});

// This event is triggered when a job is marked as finished.
ponder.on("JobsContract:JobFinished", async ({ event, context }) => {
	// Updates the job to mark it as finished
	await context.db
		.update(job, {
			jobId: event.args.jobId,
			postingId: event.args.postingId,
		})
		.set({
			state: JobState.Finished,
			finishedAt: BigInt(event.args.timestamp),
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});
});

// This event is triggered when a job is rated.
ponder.on("JobsContract:JobRated", async ({ event, context }) => {
	// Updates the job to add the rating
	await context.db
		.update(job, {
			jobId: event.args.jobId,
			postingId: event.args.postingId,
		})
		.set({
			rating: event.args.rating || 0n,
			lastTransactionHash: event.transaction.hash,
		});

	const _job = await context.db.find(job, {
		jobId: event.args.jobId,
		postingId: event.args.postingId,
	});

	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _job?.freelancer as unknown as string,
		title: "The client rated your job",
		message: `Your job "${_job?.title}" was rated with ${
			event.args.rating || 0n
		} ⭐`,
		href: `/job-posting/${event.args.postingId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.jobId,
	});
});

// This event is triggered when a job is cancelled.
ponder.on("JobsContract:JobCancelled", async ({ event, context }) => {
	// Updates the job to mark it as cancelled

	console.log("Cancelling job from:", event.transaction.from);
	await context.db
		.update(job, {
			jobId: event.args.jobId,
			postingId: event.args.postingId,
		})
		.set({
			state: event.args.state,
			clientCancelled: event.args.clientCancelled,
			freelancerCancelled: event.args.freelancerCancelled,
			canceledAt: BigInt(event.args.timestamp),
			emitBy: event.transaction.from,
			lastTransactionHash: event.transaction.hash,
		});

	const _job = await context.db.find(job, {
		jobId: event.args.jobId,
		postingId: event.args.postingId,
	});

	if (event.args.freelancerCancelled && event.args.clientCancelled) {
		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _job?.freelancer as unknown as string,
			title: "The job was cancelled",
			message: `The job "${_job?.title}" has been cancelled.`,
			href: `/job-posting/${event.args.postingId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.jobId,
		});

		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _job?.client as unknown as string,
			title: "The job was cancelled",
			message: `The job "${_job?.title}" has been cancelled.`,
			href: `/job-posting/${event.args.postingId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.jobId,
		});
	} else if (event.args.clientCancelled) {
		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _job?.freelancer as unknown as string,
			title: "The job was cancelled by the client",
			message: `The client for job "${_job?.title}" wants to cancel it.`,
			href: `/job-posting/${event.args.postingId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.jobId,
		});
	} else if (event.args.freelancerCancelled) {
		await context.db.insert(notification).values({
			id: `${event.block.number}-${event.log.logIndex}`,
			user: _job?.client as unknown as string,
			title: "The job was cancelled by the freelancer",
			message: `The freelancer for job "${_job?.title}" wants to cancel it.`,
			href: `/job-posting/${event.args.postingId}`,
			createdAt: BigInt(event.block.timestamp),
			itemId: event.args.jobId,
		});
	}
});

ponder.on("JobsContract:JobRejected", async ({ event, context }) => {
	// Updates the job to mark it as cancelled


	await context.db
		.update(job, {
			jobId: event.args.jobId,
			postingId: event.args.postingId,
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

	const _job = await context.db.find(job, {
		jobId: event.args.jobId,
		postingId: event.args.postingId,
	});

	await context.db.update(jobDeliverable, {
		jobId: event.args.jobId,
		postingId: event.args.postingId,
		uploadedAt: event.args.deliverableUploadedAt,
	}).set({
		clientResponse: event.args.comment,
		responseTimestamp: BigInt(event.args.timestamp),
		lastTransactionHash: event.transaction.hash,
	});
	
	await context.db.insert(notification).values({
		id: `${event.block.number}-${event.log.logIndex}`, // Unique ID for the notification
		user: _job?.freelancer as unknown as string,
		title: "Job rejected",
		message: `The job "${_job?.title}" has been rejected by the client.`,
		href: `/job-posting/${event.args.jobId}`,
		createdAt: BigInt(event.block.timestamp),
		itemId: event.args.jobId,
	});
});
