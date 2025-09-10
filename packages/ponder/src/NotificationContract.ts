import { ponder } from "ponder:registry";
import { notification } from "ponder:schema";

ponder.on(
	"NotificationsContract:NotificationsRemoved",
	async ({ event, context }) => {
		const { ids, user } = event.args;

		// Remove notifications from the database
		for (const id of ids) {
			await context.db.delete(notification, { user, id });
		}
	}
);

ponder.on(
	"NotificationsContract:ChangeNotificationsStatus",
	async ({ event, context }) => {
		const { ids, status, user } = event.args;

		for (const id of ids) {
			await context.db.update(notification, { user, id }).set({ status });
		}
	}
);
