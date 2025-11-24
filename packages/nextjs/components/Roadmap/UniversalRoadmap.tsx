import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { GigState } from "~~/types/gig/gig.types";
import { HiredTalentState } from "~~/types/hiredTalent/hiredTalent.types";

interface UniversalRoadmapProps {
  data: any;
  type: "hiredTalent" | "gig";
}

const formatDate = (dateString: string | undefined) => {
  return dateString ? new Date(Number(dateString) * 1000).toLocaleDateString() : "N/A";
};

function getAllRoadmapSteps(data: any, type: "hiredTalent" | "gig") {
  if (type === "hiredTalent") {
    const hiredTalent = data;
    const baseSteps = [
      {
        title: "Hire Created",
        date: formatDate(hiredTalent.createdAt),
        completed: true,
        current: false,
        state: "created",
      },
      {
        title: "Waiting for Approval",
        date: hiredTalent.state >= HiredTalentState.WaitingForApproval ? formatDate(hiredTalent.createdAt) : null,
        completed: hiredTalent.state > HiredTalentState.WaitingForApproval,
        current: hiredTalent.state === HiredTalentState.WaitingForApproval,
        state: "waiting",
      },
      {
        title: "Hire Accepted",
        date: hiredTalent.acceptedAt ? formatDate(hiredTalent.acceptedAt) : null,
        completed: hiredTalent.state > HiredTalentState.Ongoing || !!hiredTalent.acceptedAt,
        current: hiredTalent.state === HiredTalentState.Ongoing,
        state: "accepted",
      },
      {
        title: "Freelancer Delivered",
        date: hiredTalent.freelancerDelivered ? "Delivered" : null,
        completed: hiredTalent.freelancerDelivered || false,
        current: hiredTalent.state === HiredTalentState.Ongoing && !hiredTalent.freelancerDelivered,
        state: "delivered",
      },
      {
        title: "Client Received",
        date: hiredTalent.clientReceived ? "Received" : null,
        completed: hiredTalent.clientReceived || false,
        current:
          hiredTalent.state === HiredTalentState.Ongoing &&
          hiredTalent.freelancerDelivered &&
          !hiredTalent.clientReceived,
        state: "received",
      },
    ];
    if (hiredTalent.wasDisputed && !hiredTalent.disputeDismissed && hiredTalent.state !== HiredTalentState.Ongoing) {
      baseSteps.push({
        title: "Hire Disputed",
        date: `In Dispute${hiredTalent.disputeBeingArbitrated ? " (Under Arbitration)" : ""}`,
        completed: true,
        current: hiredTalent.state === HiredTalentState.Disputed,
        state: "disputed",
      });
      baseSteps.push({
        title: hiredTalent.disputeFinalized
          ? hiredTalent.disputeResult
            ? "Dispute Resolved: Freelancer Wins"
            : "Dispute Resolved: Client Wins"
          : "Dispute Resolution",
        date: hiredTalent.finishedAt ? formatDate(hiredTalent.finishedAt) : null,
        completed: hiredTalent.disputeFinalized || false,
        current: false,
        state: "disputed",
      });
    }

    if (hiredTalent.state === HiredTalentState.Cancelled) {
      baseSteps.push({
        title: "Hire Cancelled",
        date: hiredTalent.canceledAt ? formatDate(hiredTalent.canceledAt) : null,
        completed: true,
        current: false,
        state: "cancelled",
      });
    } else {
      baseSteps.push({
        title:
          hiredTalent.wasDisputed && !hiredTalent.disputeDismissed && hiredTalent.state !== HiredTalentState.Ongoing
            ? "Hire Finalized After Dispute"
            : "Hire Completed",
        date: hiredTalent.finishedAt ? formatDate(hiredTalent.finishedAt) : null,
        completed: hiredTalent.state === HiredTalentState.Finished,
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

    if (gig.wasDisputed && !gig.currentlyDismissed && gig.state !== GigState.InProgress) {
      baseSteps.push({
        title: "Gig Disputed",
        date: `In Dispute${gig.disputeBeingArbitrated ? " (Under Arbitration)" : ""}`,
        completed: true,
        current: gig.state === GigState.Disputed,
        state: "disputed",
      });
      baseSteps.push({
        title: gig.disputeFinalized
          ? gig.disputeResult
            ? "Dispute Resolved: Freelancer Wins"
            : "Dispute Resolved: Client Wins"
          : "Dispute Resolution",
        date: gig.finishedAt ? formatDate(gig.finishedAt) : null,
        completed: gig.disputeFinalized || false,
        current: false,
        state: "disputed",
      });
    }

    if (gig.state === GigState.Cancelled) {
      baseSteps.push({
        title: "Gig Cancelled",
        date: gig.canceledAt ? formatDate(gig.canceledAt) : null,
        completed: true,
        current: false,
        state: "cancelled",
      });
    } else {
      baseSteps.push({
        title:
          gig.wasDisputed && !gig.currentlyDismissed && gig.state !== GigState.InProgress
            ? "Gig Finalized After Dispute"
            : "Gig Completed",
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
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg flex flex-1 flex-col h-full">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl text-[var(--color-primary-content)]">
          {type === "hiredTalent" ? "Hire Progress" : "Gig Progress"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 h-full">
        <div className="relative pl-2 flex flex-col overflow-auto justify-between h-full">
          {/* Continuous line from first to last step */}
          <div
            className="absolute left-5.5 w-0.5 bg-[var(--color-border)]"
            style={{
              top: "16px",
              bottom: `calc(100% - ${allSteps.length * 100}%)`,
              height: `calc(100% - 40px)`,
            }}
          />
          {allSteps.map((step, index) => (
            <div key={index} className="relative flex items-start gap-6">
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
                <div
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
                </div>
                {step.date && step.date !== "N/A" && (
                  <div className="text-sm text-[var(--color-skeleton)] mt-1">{step.date}</div>
                )}
                {!step.date && !step.completed && !step.current && (
                  <div className="text-sm text-[var(--color-skeleton)]/60 mt-1 italic">Pending</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
