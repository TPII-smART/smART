import { ponder } from "ponder:registry";
import { job, jobPosting } from "ponder:schema";
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
	}
);

// This event is triggered when a job is marked as completed by a freelancer.
ponder.on(
	"JobsContract:FileUploaded",
	async ({ event, context }) => {
		// Updates the job to mark it as file uploaded
		await context.db
			.update(job, {
				jobId: event.args.jobId,
				postingId: event.args.postingId,
			})
			.set({
				resource: event.args.resource,
				submissionComment: event.args.submissionComment,
				isLink: event.args.isLink,
				uploadedAt: BigInt(event.block.timestamp),
				lastTransactionHash: event.transaction.hash,
			});
	}
);

// This event is triggered when a a client add a comment to the uploaded file.
ponder.on(
	"JobsContract:CommentAdded",
	async ({ event, context }) => {
		// Updates the job to mark it as file uploaded
		await context.db
			.update(job, {
				jobId: event.args.jobId,
				postingId: event.args.postingId,
			})
			.set({
				clientResponse: event.args.response,
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
});


ponder.on("JobsContract:JobRejected", async ({ event, context }) => {
	// Updates the job to mark it as cancelled

	console.log("Rejecting job from:", event.transaction.from);
	console.log("Event args:", event.args);

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
			lastTransactionHash: event.transaction.hash,
		});
});