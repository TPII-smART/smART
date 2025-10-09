import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { HiredTalentState } from "@se-2/common";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { HiredTalent } from "~~/types/hiredTalent";

export function HiredTalentRoadmap({ hiredTalent }: { hiredTalent: HiredTalent }) {
  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(Number(dateString) * 1000).toLocaleDateString() : "N/A";
  };

  // Always show all possible states, but adapt based on hiredTalent state
  const getAllRoadmapSteps = () => {
    const baseSteps = [
      {
        title: "HiredTalent Created",
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
        title: "HiredTalent Accepted",
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

    // Add the appropriate final state based on hiredTalent status
    if (hiredTalent.state === HiredTalentState.Cancelled) {
      baseSteps.push({
        title: "HiredTalent Cancelled",
        date: hiredTalent.canceledAt ? formatDate(hiredTalent.canceledAt) : null,
        completed: true,
        current: false,
        state: "cancelled",
      });
    } else if (hiredTalent.state === HiredTalentState.Disputed) {
      baseSteps.push({
        title: "HiredTalent Disputed",
        date: "In Dispute",
        completed: true,
        current: false,
        state: "disputed",
      });
    } else {
      baseSteps.push({
        title: "HiredTalent Completed",
        date: hiredTalent.finishedAt ? formatDate(hiredTalent.finishedAt) : null,
        completed: hiredTalent.state === HiredTalentState.Finished,
        current: false,
        state: "finished",
      });
    }

    return baseSteps;
  };

  const allSteps = getAllRoadmapSteps();

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl text-[var(--color-primary-content)]">HiredTalent Progress</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="relative pl-2">
          {allSteps.map((step, index) => (
            <div key={index} className="relative flex items-start gap-4 pb-8 last:pb-0">
              {/* Timeline line - positioned correctly relative to the circle */}
              {index < allSteps.length - 1 && (
                <div
                  className="absolute left-4 top-8 w-0.5 bg-[var(--color-border)]"
                  style={{ height: "calc(100% - 16px)" }}
                />
              )}

              {/* Status indicator */}
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

              {/* Step content */}
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
