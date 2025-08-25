import Image from "next/image";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/Badge";
import { Card, CardContent } from "@/components/Card";
import { BlockieAvatar } from "@/components/scaffold-eth";
import { CheckCircle, Clock, DollarSign, Eye, FileText, MessageSquare, Star, XCircle } from "lucide-react";
import { useUserProfile } from "~~/hooks/use-user-profile";
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
      } else if (status === ActivityItemStatus.cancelled || status === ActivityItemStatus.rejected) {
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

const getActivityColor = (type: ActivityItem["type"], status?: ActivityItem["status"]) => {
  if (status === ActivityItemStatus.accepted || type === "payment" || type === "review") {
    return "color-primary-content";
  }
  if (status === ActivityItemStatus.cancelled || status === ActivityItemStatus.rejected) {
    return "text-destructive";
  }
  if (type === "message") {
    return "color-primary-content";
  }
  return "text-muted-foreground";
};

export function FeedActivityCard({ activity }: { activity: ActivityItem }) {
  const { profilePicture: profilePicture, username: username, isLoading: isLoading } = useUserProfile(activity.emitBy);
  const router = useRouter();

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activity.emitBy) {
      router.push(`/profile/${activity.emitBy}`);
    }
  };

  const renderAvatar = () => {
    const imageToShow = profilePicture;

    if (imageToShow) {
      return (
        <Image
          src={typeof imageToShow === "string" ? imageToShow : ""}
          width={32}
          height={32}
          alt="User avatar"
          className=" rounded-full object-cover"
          onClick={handleProfileClick}
          onError={e => {
            // ✅ Fallback al BlockieAvatar si la imagen falla
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "block";
          }}
        />
      );
    }

    if (isLoading) {
      return <div className="h-32 w-32 rounded-full bg-gray-300 animate-pulse" />;
    }

    return (
      <span onClick={handleProfileClick} className="cursor-pointer">
        <BlockieAvatar address={activity.emitBy ? activity.emitBy : ""} size={32} />
      </span>
    );
  };
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
        <div className="flex items-start gap-9">
          <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type, activity.status)}`}>
            {getActivityIcon(activity.type, activity.status)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-xl text-foreground inline-flex items-center gap-2">
                  {activity.title}
                  {activity.isNew && (
                    <span className="inline-block h-2 w-2 bg-[var(--color-success)] rounded-full self-center"></span>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm mb-2">{activity.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  {activity.client && <div className="flex items-center gap-2 ">{renderAvatar()}</div>}

                  {activity.amount && (
                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <DollarSign className="h-4 w-4" />
                      {activity.amount.toLocaleString()}
                    </div>
                  )}

                  <span className="text-muted-foreground ">
                    {username ? (
                      <span>{username}</span>
                    ) : (
                      <span>
                        {activity.emitBy ? `${activity.emitBy.slice(0, 6)}...${activity.emitBy.slice(-4)}` : ""}
                      </span>
                    )}
                  </span>

                  <span className="text-muted-foreground">{activity.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activity.status && <StatusBadge status={activity.status} />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
