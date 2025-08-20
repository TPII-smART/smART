"use client";

import { FeedActivityCard } from "@/components/Card/FeedCard/FeedCard";
import Button from "~~/components/Button/Button";
import { ActivityItem } from "~~/types/feed/activityItem.type";

// WORKFLOW
// POST OF A JOB -- HIRE THE FREELANCER FOR THE JOB  -- FREELANCER ACCEPTED THE JOB
//                                                   -- FREELANCER DENIED THE JOB
// POST OF A GIG -- FREELACER POSTULATE FOR THE JOB -- ACCEPT ONLY ONE FREELANCER AND DENIED THE OTHERS
// MESSAGES
// PAYMENTS

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "application",
    title: "New Application Submitted",
    description: 'Applied for "React Developer for E-commerce Platform"',
    timestamp: "2 hours ago",
    status: "pending",
    client: { name: "TechCorp Inc", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
    isNew: true,
  },
  {
    id: "2",
    type: "status",
    title: "Application Accepted",
    description: 'Your proposal for "Mobile App UI Design" has been accepted',
    timestamp: "4 hours ago",
    status: "accepted",
    client: { name: "StartupXYZ", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
    isNew: true,
  },
  {
    id: "3",
    type: "message",
    title: "New Message from Client",
    description: "Sarah Johnson sent you a message about the project timeline",
    timestamp: "6 hours ago",
    client: { name: "Sarah Johnson", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
    isNew: true,
  },
  {
    id: "4",
    type: "payment",
    title: "Payment Received",
    description: 'Payment for "Website Redesign Project" has been processed',
    timestamp: "1 day ago",
    status: "completed",
    amount: 2500,
    client: { name: "Digital Agency Pro" },
  },
  {
    id: "5",
    type: "view",
    title: "Profile Viewed",
    description: "Your profile was viewed by a potential client",
    timestamp: "1 day ago",
    client: { name: "Anonymous Client" },
  },
  {
    id: "6",
    type: "review",
    title: "New Review Received",
    description: "Michael Chen left a 5-star review for your work",
    timestamp: "2 days ago",
    client: { name: "Michael Chen", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
  },
  {
    id: "7",
    type: "status",
    title: "Application Rejected",
    description: 'Your proposal for "Logo Design Contest" was not selected',
    timestamp: "3 days ago",
    status: "rejected",
    client: { name: "Creative Studio" },
  },
];

export default function ActivityFeed() {
  return (
    <div className="h-full flex flex-col overflow-hidden space-y-4">
      <div className="flex items-center justify-between mt-12 px-10">
        <h2 className="text-2xl font-semibold text-foreground">Activity Feed</h2>
        <Button variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>

      <div className=" flex-1 overflow-y-auto space-y-4 mx-10 max-w-full">
        {mockActivities.map(activity => (
          <FeedActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      {/* 
      <div className="text-center py-8">
        <Button variant="outline">Load More Activities</Button>
      </div> */}
    </div>
  );
}
