import { Badge } from "@/components/Badge";
import { Card, CardContent } from "@/components/Card";
import { BlockieAvatar } from "@/components/scaffold-eth";
import { CheckCircle, Clock, DollarSign, Eye, FileText, MessageSquare, Star, XCircle } from "lucide-react";
import { cn } from "~~/lib/utils";
import { ActivityItem, ActivityItemStatus } from "~~/types/feed/activityItem.type";

const getActivityIcon = (type: ActivityItem["type"], status: ActivityItem["status"]) => {
  switch (type) {
    case "application":
      return <FileText className="h-5 w-5" />;
    case "message":
      return <MessageSquare className="h-5 w-5" />;
    case "status":
      if (status === ActivityItemStatus.pending) {
        return <Clock className="h-5 w-5" />;
      } else if (status === ActivityItemStatus.accepted || status === ActivityItemStatus.completed) {
        return <CheckCircle className="h-5 w-5" />;
      } else if (status === ActivityItemStatus.cancelled) {
        return <XCircle className="h-5 w-5" />;
      } else if (status === ActivityItemStatus.waitingForReview) {
        return <Clock className="h-5 w-5" />;
      }
    case "payment":
      return <DollarSign className="h-5 w-5" />;
    case "view":
      return <Eye className="h-5 w-5" />;
    case "review":
      return <Star className="h-5 w-5" />;
    default:
      return <Clock className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: ActivityItem["status"]) => {
  switch (status) {
    case ActivityItemStatus.pending:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case ActivityItemStatus.accepted:
      return <Badge className="bg-[var(--color-success)] text-white">Accepted</Badge>;
    case ActivityItemStatus.cancelled:
      return <Badge className="bg-[var(--color-error)] text-white">Cancelled</Badge>;
    case ActivityItemStatus.completed:
      return <Badge className="bg-[var(--color-success)] text-white">Completed</Badge>;
    case ActivityItemStatus.waitingForReview:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Waiting For Review</Badge>;
    default:
      return null;
  }
};

const getActivityColor = (type: ActivityItem["type"], status?: ActivityItem["status"]) => {
  if (status === ActivityItemStatus.accepted || type === "payment" || type === "review") {
    return "color-primary-content";
  }
  if (status === ActivityItemStatus.cancelled) {
    return "text-destructive";
  }
  if (type === "message") {
    return "color-primary-content";
  }
  return "text-muted-foreground";
};

export function FeedActivityCard({ activity }: { activity: ActivityItem }) {
  return (
    <Card
      data-slot="card"
      className={cn(
        `flex flex-col gap-6 transition-all p-10`,
        "group relative  transition-all duration-300 ease-in-out",
        // Only shadow and translate on hover, not scale or blur
        "over:shadow-xl hover:-translate-y-1 hover:z-10",
      )}
    >
      <CardContent>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type, activity.status)}`}>
            {getActivityIcon(activity.type, activity.status)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground inline-flex items-center gap-2">
                  {activity.title}
                  {activity.isNew && (
                    <span className="inline-block h-2 w-2 bg-[var(--color-success)] rounded-full self-center"></span>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm mb-2">{activity.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  {activity.client && (
                    <div className="flex items-center gap-2 ">
                      <BlockieAvatar address={activity.client ? activity.client : ""} size={32} />
                    </div>
                  )}

                  {activity.amount && (
                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <DollarSign className="h-4 w-4" />
                      {activity.amount.toLocaleString()}
                    </div>
                  )}

                  <span className="text-muted-foreground ">{activity.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">{activity.status && getStatusBadge(activity.status)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
