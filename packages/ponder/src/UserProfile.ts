import { ponder } from "ponder:registry";
import { userProfile } from "ponder:schema";

// ProfileUpdated event handler
ponder.on(
	"ProfileConfigContract:ProfileUpdated",
	async ({ event, context }) => {
		// Insert or update the user profile
		console.log("ProfileUpdated event received:", event.args);
		await context.db
			.insert(userProfile)
			.values({
				address: event.args.user,
				...event.args.profile,
				lastTransactionHash: event.transaction.hash,
			})
			.onConflictDoUpdate({
				...event.args.profile,
				lastTransactionHash: event.transaction.hash,
			});
	}
);
