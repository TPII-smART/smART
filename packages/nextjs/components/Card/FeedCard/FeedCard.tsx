import { Badge } from "@/components/Badge";
import { Card, CardContent } from "@/components/Card";
import { CheckCircle, Clock, DollarSign, Eye, FileText, MessageSquare, Star } from "lucide-react";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import Button from "~~/components/Button/Button";
import { cn } from "~~/lib/utils";
import { ActivityItem } from "~~/types/feed/activityItem.type";

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "application":
      return <FileText className="h-5 w-5" />;
    case "message":
      return <MessageSquare className="h-5 w-5" />;
    case "status":
      return <CheckCircle className="h-5 w-5" />;
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
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case "accepted":
      return <Badge className="bg-[var(--color-success)] text-white">Accepted</Badge>;
    case "rejected":
      return <Badge className="bg-[var(--color-error)] text-white">Rejected</Badge>;
    case "completed":
      return <Badge className="bg-[var(--color-success)] text-white">Completed</Badge>;
    default:
      return null;
  }
};

const getActivityColor = (type: ActivityItem["type"], status?: ActivityItem["status"]) => {
  if (status === "accepted" || type === "payment" || type === "review") {
    return "color-primary-content";
  }
  if (status === "rejected") {
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
            {getActivityIcon(activity.type)}
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
                      <div className="relative">
                        <AvatarImage
                          src={activity.client.avatar || "/placeholder.svg"}
                          alt={activity.client.name}
                          width={32}
                          height={32}
                        />
                      </div>
                      <span className="text-muted-foreground">{activity.client.name}</span>
                    </div>
                  )}

                  {activity.amount && (
                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <DollarSign className="h-4 w-4" />
                      {activity.amount.toLocaleString()}
                    </div>
                  )}

                  <span className="text-muted-foreground">{activity.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activity.status && getStatusBadge(activity.status)}
                {(activity.type === "message" || activity.type === "application") && (
                  <Button size="sm" variant="outline" className="text-muted-foreground">
                    {activity.type === "message" ? "Reply" : "View"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
