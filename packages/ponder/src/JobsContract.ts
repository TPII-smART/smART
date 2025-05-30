import { ponder } from "ponder:registry";
import { job, confirmation } from "ponder:schema";

ponder.on("JobsContract:JobCreated", async ({ event, context }) => {
    // Create a new Job
    await context.db.insert(job).values({
        jobId: event.args.jobId,
        freelancer: event.args.freelancer || null,
        client: event.args.client || null,
        payment: event.args.payment || null,
        title: event.args.title || null,
        description: event.args.description || null,
        estimatedDuration: event.args.estimatedDuration || null,
        createdAt: BigInt(event.block.timestamp),
        acceptedAt: null, // Initially null
        deadline: event.args.deadline || null,
        completedAt: null, // Initially null
        cancelledAt: null, // Initially null
    });
});

ponder.on("JobsContract:JobAccepted", async ({ event, context }) => {
    // Update the Job as accepted
    await context.db.update(job, { jobId: event.args.jobId })
        .set({ client: event.args.client, acceptedAt: BigInt(event.block.timestamp) });
});

ponder.on("JobsContract:JobCompleted", async ({ event, context }) => {
    // Update the Job as completed
    await context.db.update(job, { jobId: event.args.jobId })
        .set({ completedAt: BigInt(event.block.timestamp) });
});

ponder.on("JobsContract:JobCancelled", async ({ event, context }) => {
    // Update the Job as cancelled
    await context.db.update(job, { jobId: event.args.jobId })
        .set({ cancelledAt: BigInt(event.block.timestamp) });
});

ponder.on("JobsContract:ConfirmationReceived", async ({ event, context }) => {
    // Create a new Confirmation
    await context.db.insert(confirmation).values({
        id: `${event.args.jobId}-${event.args.confirmer}`,
        jobId: event.args.jobId,
        confirmer: event.args.confirmer,
        isClient: event.args.isClient,
        timestamp: BigInt(event.block.timestamp),
    });
});