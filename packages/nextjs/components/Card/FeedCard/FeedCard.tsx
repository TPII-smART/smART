import { Badge } from "@/components/Badge";
import { CheckCircle, Clock, DollarSign, Eye, FileText, MessageSquare, Star } from "lucide-react";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import Button from "~~/components/Button/Button";
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
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "accepted":
      return <Badge className="bg-primary text-primary-foreground">Accepted</Badge>;
    case "rejected":
      return <Badge variant="secondary">Rejected</Badge>;
    case "completed":
      return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
    default:
      return null;
  }
};

const getActivityColor = (type: ActivityItem["type"], status?: ActivityItem["status"]) => {
  if (status === "accepted" || type === "payment" || type === "review") {
    return "text-primary";
  }
  if (status === "rejected") {
    return "text-destructive";
  }
  if (type === "message") {
    return "text-accent";
  }
  return "text-muted-foreground";
};

export function FeedActivityCard({ activity }: { activity: ActivityItem }) {
  return (
    <div
      data-slot="card"
      className={"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"}
    >
      {/* <FeedCard className={`transition-all hover:shadow-md ${event.isNew ? "ring-2 ring-primary/20" : ""}`}> */}
      <div data-slot="card-content" className={"px-6 p-6"}>
        {/* ...todo el contenido de la card que tienes en el map... */}
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type, activity.status)}`}>
            {getActivityIcon(activity.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{activity.title}</h3>
                  {activity.isNew && <div className="h-2 w-2 bg-primary rounded-full"></div>}
                </div>
                <p className="text-muted-foreground text-sm mb-2">{activity.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  {activity.client && (
                    <div className="flex items-center gap-2 ">
                      <div className="relative">
                        <AvatarImage
                          src={activity.client.avatar || "/placeholder.svg"}
                          alt={activity.client.name}
                          width={50}
                          height={50}
                        />
                      </div>

                      <span className="text-muted-foreground">{activity.client.name}</span>
                    </div>
                  )}

                  {activity.amount && (
                    <div className="flex items-center gap-1 text-primary font-medium">
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
                  <Button size="sm" variant="outline">
                    {activity.type === "message" ? "Reply" : "View"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
