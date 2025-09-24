import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { GigState, JobState } from "@se-2/common";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface UniversalRoadmapProps {
  data: any;
  type: "job" | "gig";
}

const formatDate = (dateString: string | undefined) => {
  return dateString ? new Date(Number(dateString) * 1000).toLocaleDateString() : "N/A";
};

function getAllRoadmapSteps(data: any, type: "job" | "gig") {
  if (type === "job") {
    const job = data;
    const baseSteps = [
      {
        title: "Job Created",
        date: formatDate(job.createdAt),
        completed: true,
        current: false,
        state: "created",
      },
      {
        title: "Waiting for Approval",
        date: job.state >= JobState.WaitingForApproval ? formatDate(job.createdAt) : null,
        completed: job.state > JobState.WaitingForApproval,
        current: job.state === JobState.WaitingForApproval,
        state: "waiting",
      },
      {
        title: "Job Accepted",
        date: job.acceptedAt ? formatDate(job.acceptedAt) : null,
        completed: job.state > JobState.Ongoing || !!job.acceptedAt,
        current: job.state === JobState.Ongoing,
        state: "accepted",
      },
      {
        title: "Freelancer Delivered",
        date: job.freelancerDelivered ? "Delivered" : null,
        completed: job.freelancerDelivered || false,
        current: job.state === JobState.Ongoing && !job.freelancerDelivered,
        state: "delivered",
      },
      {
        title: "Client Received",
        date: job.clientReceived ? "Received" : null,
        completed: job.clientReceived || false,
        current: job.state === JobState.Ongoing && job.freelancerDelivered && !job.clientReceived,
        state: "received",
      },
    ];
    if (job.wasDisputed) {
      baseSteps.push({
        title: "Job Disputed",
        date: "In Dispute",
        completed: true,
        current: job.state === JobState.Disputed,
        state: "disputed",
      });
      baseSteps.push({
        title: job.disputeResult ? "Dispute Resolved: Freelancer Wins" : "Dispute Resolved: Client Wins",
        date: job.finishedAt ? formatDate(job.finishedAt) : null,
        completed: true,
        current: false,
        state: "disputed",
      });
    }

    if (job.state === JobState.Cancelled) {
      baseSteps.push({
        title: "Job Cancelled",
        date: job.canceledAt ? formatDate(job.canceledAt) : null,
        completed: true,
        current: false,
        state: "cancelled",
      });
    } else {
      baseSteps.push({
        title: job.wasDisputed ? "Job Finalized After Dispute" : "Job Completed",
        date: job.finishedAt ? formatDate(job.finishedAt) : null,
        completed: job.state === JobState.Finished,
        current: false,
        state: "finished",
      });
    }

    return baseSteps;
  } else {
    // Adapt for gig states and fields
    const gig = data;
    const baseSteps = [
      {
        title: "Gig Created",
        date: formatDate(gig.createdAt),
        completed: true,
        current: false,
        state: "created",
      },
      {
        title: "Waiting for Applications",
        date: gig.state >= GigState.Open ? formatDate(gig.createdAt) : null,
        completed: gig.state > GigState.Open,
        current: gig.state === GigState.Open,
        state: "waiting",
      },
      {
        title: "Gig Accepted",
        date: gig.acceptedAt ? formatDate(gig.acceptedAt) : null,
        completed: gig.state > GigState.InProgress || !!gig.acceptedAt,
        current: gig.state === GigState.InProgress,
        state: "accepted",
      },
      {
        title: "Freelancer Delivered",
        date: gig.freelancerDelivered ? "Delivered" : null,
        completed: gig.freelancerDelivered || false,
        current: gig.state === GigState.InProgress && !gig.freelancerDelivered,
        state: "delivered",
      },
      {
        title: "Client Received",
        date: gig.clientReceived ? "Received" : null,
        completed: gig.clientReceived || false,
        current: gig.state === GigState.InProgress && gig.freelancerDelivered && !gig.clientReceived,
        state: "received",
      },
    ];

    if (gig.state === GigState.Cancelled) {
      baseSteps.push({
        title: "Gig Cancelled",
        date: gig.canceledAt ? formatDate(gig.canceledAt) : null,
        completed: true,
        current: false,
        state: "cancelled",
      });
    } else if (gig.state === GigState.Disputed) {
      baseSteps.push({
        title: "Gig Disputed",
        date: "In Dispute",
        completed: true,
        current: false,
        state: "disputed",
      });
    } else {
      baseSteps.push({
        title: "Gig Completed",
        date: gig.finishedAt ? formatDate(gig.finishedAt) : null,
        completed: gig.state === GigState.Completed,
        current: false,
        state: "finished",
      });
    }

    return baseSteps;
  }
}

export function UniversalRoadmap({ data, type }: UniversalRoadmapProps) {
  const allSteps = getAllRoadmapSteps(data, type);

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl text-[var(--color-primary-content)]">
          {type === "job" ? "Job Progress" : "Gig Progress"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="relative pl-2">
          {allSteps.map((step, index) => (
            <div key={index} className="relative flex items-start gap-4 pb-8 last:pb-0">
              {index < allSteps.length - 1 && (
                <div
                  className="absolute left-4 top-8 w-0.5 bg-[var(--color-border)]"
                  style={{ height: "calc(100% - 16px)" }}
                />
              )}
              <div
                className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0
                  ${
                    step.completed
                      ? step.state === "cancelled"
                        ? "bg-[var(--color-error)] border-[var(--color-error)]"
                        : step.state === "disputed"
                          ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                          : "bg-[var(--color-success)] border-[var(--color-success)]"
                      : step.current
                        ? "bg-[var(--color-warning)] border-[var(--color-warning)]"
                        : "bg-[var(--color-surface)] border-[var(--color-border)]"
                  }
                `}
              >
                {step.completed && <CheckCircleIcon className="w-5 h-5 text-white" />}
                {step.current && !step.completed && <div className="w-3 h-3 bg-white rounded-full" />}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p
                  className={`
                  font-semibold text-base
                  ${
                    step.completed || step.current
                      ? "text-[var(--color-primary-content)]"
                      : "text-[var(--color-skeleton)]"
                  }
                `}
                >
                  {step.title}
                </p>
                {step.date && step.date !== "N/A" && (
                  <p className="text-sm text-[var(--color-skeleton)] mt-1">{step.date}</p>
                )}
                {!step.date && !step.completed && !step.current && (
                  <p className="text-sm text-[var(--color-skeleton)]/60 mt-1 italic">Pending</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
