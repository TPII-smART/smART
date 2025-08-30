import { Badge } from "@/components/Badge";
import Button from "@/components/Button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import Spinner from "@/components/Spinner/Spinner";
import { fetchJob } from "@services/graphql/fetchers/job";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { CalendarDaysIcon, ClockIcon, CurrencyDollarIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { ArrowDownTrayIcon, CheckCircleIcon, PaperAirplaneIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDisplayUsdMode } from "~~/hooks/scaffold-eth/useDisplayUsdMode";
import { useGlobalState } from "~~/services/store/store";
import { Job, JobStateEnum } from "~~/types/job";

// New component for the vertical roadmap
function JobRoadmap({ job }: { job: Job }) {
  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(Number(dateString) * 1000).toLocaleDateString() : "N/A";
  };

  // Always show all possible states, but adapt based on job state
  const getAllRoadmapSteps = () => {
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
        date: job.state >= JobStateEnum.WaitingForApproval ? formatDate(job.createdAt) : null,
        completed: job.state > JobStateEnum.WaitingForApproval,
        current: job.state === JobStateEnum.WaitingForApproval,
        state: "waiting",
      },
      {
        title: "Job Accepted",
        date: job.acceptedAt ? formatDate(job.acceptedAt) : null,
        completed: job.state > JobStateEnum.Ongoing || !!job.acceptedAt,
        current: job.state === JobStateEnum.Ongoing,
        state: "accepted",
      },
      {
        title: "Freelancer Delivered",
        date: job.freelancerDelivered ? "Delivered" : null,
        completed: job.freelancerDelivered || false,
        current: job.state === JobStateEnum.Ongoing && !job.freelancerDelivered,
        state: "delivered",
      },
      {
        title: "Client Received",
        date: job.clientReceived ? "Received" : null,
        completed: job.clientReceived || false,
        current: job.state === JobStateEnum.Ongoing && job.freelancerDelivered && !job.clientReceived,
        state: "received",
      },
    ];

    // Add the appropriate final state based on job status
    if (job.state === JobStateEnum.Cancelled) {
      baseSteps.push({
        title: "Job Cancelled",
        date: job.canceledAt ? formatDate(job.canceledAt) : null,
        completed: true,
        current: false,
        state: "cancelled",
      });
    } else if (job.state === JobStateEnum.Disputed) {
      baseSteps.push({
        title: "Job Disputed",
        date: "In Dispute",
        completed: true,
        current: false,
        state: "disputed",
      });
    } else {
      baseSteps.push({
        title: "Job Completed",
        date: job.finishedAt ? formatDate(job.finishedAt) : null,
        completed: job.state === JobStateEnum.Finished,
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
        <CardTitle className="text-2xl text-[var(--color-primary-content)]">Job Progress</CardTitle>
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

export default function JobDetail({ postingId, jobId }: { postingId: string; jobId: string }) {
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  // Logic related to parsing from ETH to USD
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  // const isNativeCurrencyPriceFetching = useGlobalState(state => state.nativeCurrency.isFetching);
  const { displayUsdMode, toggleDisplayUsdMode } = useDisplayUsdMode({ defaultUsdMode: false });

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const { data, isLoading, error, refetch } = useQuery<Job>({
    queryKey: ["jobDetail", jobId],
    queryFn: () => fetchJob(postingId, jobId),
  });

  const isFreelancer = data?.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = data?.client?.toLowerCase() === userAddress?.toLowerCase();

  const formatPaymentDisplay = (wei: bigint) => {
    const eth = formatEther(wei);
    const ethNum = parseFloat(eth);

    if (ethNum === 0) return "Free";

    if (displayUsdMode && nativeCurrencyPrice > 0) {
      const usdValue = ethNum * nativeCurrencyPrice;
      return `$${usdValue < 0.01 ? usdValue.toFixed(6) : usdValue.toFixed(2)}`;
    } else {
      if (ethNum < 0.001) return `${ethNum.toFixed(6)} ETH`;
      if (ethNum < 1) return `${ethNum.toFixed(4)} ETH`;
      return `${ethNum.toFixed(3)} ETH`;
    }
  };

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobDetail", postingId, jobId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  const getStatusBadge = (status: number) => {
    const badgeClass = "min-w-[140px] text-center justify-center px-4 py-2";
    switch (status) {
      case JobStateEnum.WaitingForApproval:
        return (
          <Badge
            className={`bg-[var(--color-warning)] text-[var(--color-primary-content)] hover:bg-[var(--color-warning)] ${badgeClass}`}
          >
            Waiting for approval
          </Badge>
        );
      case JobStateEnum.Ongoing:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Ongoing
          </Badge>
        );
      case JobStateEnum.Cancelled:
        return <Badge className={`bg-[var(--color-error)] text-white ${badgeClass}`}>Cancelled</Badge>;
      case JobStateEnum.Finished:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Completed
          </Badge>
        );
      case JobStateEnum.Disputed:
        return <Badge className={`bg-[var(--color-accent)] text-white ${badgeClass}`}>Disputed</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(Number(dateString) * 1000).toLocaleDateString() : "N/A";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <Spinner />
      </div>
    );
  }

  // Formats the amount of hours proposed for the duration of the job to a human-readable string
  const formatDurationHours = (hours: string | undefined) => {
    if (!hours || hours === "0") return "Not specified";

    let totalHours = Number(BigInt(hours));
    let days = Math.floor(totalHours / 24);
    const weeks = Math.floor(days / 7);

    if (weeks > 0) days -= weeks * 7;
    if (days > 0) totalHours -= days * 24;

    return `${
      weeks > 0 ? `${weeks} week${weeks > 1 ? "s" : ""} ` : ""
    }${days > 0 ? `${days} day${days > 1 ? "s" : ""} ` : ""}${
      totalHours > 0 ? `${totalHours} hour${totalHours > 1 ? "s" : ""}` : ""
    }`.trim();
  };

  const handleAccept = async () => {
    try {
      if (data?.state !== JobStateEnum.WaitingForApproval) return;
      await writeContract({
        functionName: "acceptJob",
        args: [BigInt(data?.postingId), BigInt(data?.jobId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Accept job failed:", err);
    }
  };

  const handleCancel = async () => {
    try {
      if (!data?.payment || !data?.jobId) return;
      await writeContract({
        functionName: "cancelJob",
        args: [BigInt(data?.postingId), BigInt(data?.jobId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Cancel job failed:", err);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      if (!data?.jobId) return;
      await writeContract({
        functionName: "confirmCompletion",
        args: [BigInt(data?.postingId), BigInt(data?.jobId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm job completion failed:", err);
    }
  };

  // Action buttons based on user role and job state
  const getActionButtons = () => {
    const buttons = [];

    // Cancel button - available for both parties until job is finished
    if (data?.state !== JobStateEnum.Finished && data?.state !== JobStateEnum.Cancelled) {
      buttons.push(
        <Button
          variant="danger"
          key="cancel"
          onClick={() => handleCancel()}
          disabled={isMining}
          size="sm"
          tooltip="Cancel Job"
        >
          <XCircleIcon className="h-5 w-5" />
        </Button>,
      );
    }

    // Freelancer actions
    if (isFreelancer) {
      if (data?.state === JobStateEnum.WaitingForApproval) {
        buttons.push(
          <Button
            variant="primary"
            key="accept"
            onClick={handleAccept}
            disabled={isMining}
            size="sm"
            tooltip="Accept Job"
          >
            <CheckCircleIcon className="h-5 w-5" />
          </Button>,
        );
      }
      if (data?.state === JobStateEnum.Ongoing && !data?.freelancerDelivered) {
        buttons.push(
          <Button
            variant="primary"
            key="deliver"
            onClick={handleConfirmCompletion}
            disabled={isMining}
            size="sm"
            tooltip="Mark as Delivered"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </Button>,
        );
      }
    }

    // Client actions
    if (isClient) {
      if (data?.state === JobStateEnum.Ongoing) {
        if (data?.freelancerDelivered && !data?.clientReceived) {
          buttons.push(
            <Button
              variant="primary"
              key="receive"
              onClick={handleConfirmCompletion}
              disabled={isMining}
              size="sm"
              tooltip="Mark as Received"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </Button>,
          );
        }
      }
    }

    return buttons;
  };

  if (error || !data) {
    return (
      <div className="min-h-screen w-full p-8 bg-[var(--color-primary)]">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <ExclamationCircleIcon className="w-16 h-16 text-[var(--color-error)] mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-[var(--color-primary-content)]">Error loading job</h3>
                <p className="text-[var(--color-skeleton)] mb-6 text-lg">
                  {error?.message || "Failed to load job details"}
                </p>
                <Button
                  variant={"primary"}
                  onClick={reload}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-3"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-8 bg-[var(--color-primary)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
          <CardHeader className="p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <CardTitle className="text-4xl font-bold text-[var(--color-primary-content)] leading-tight">
                  {data.title}
                </CardTitle>
                <div className="flex items-center gap-6">
                  {getStatusBadge(data.state)}
                  <Badge className="bg-[var(--color-secondary)] text-[var(--color-secondary-content)] px-4 py-2 text-base">
                    {data.category}
                  </Badge>
                </div>
              </div>
              <div
                className="text-right bg-[var(--color-success)]/10 p-6 rounded-lg cursor-pointer"
                onClick={toggleDisplayUsdMode}
                title="Toggle USD/ETH display"
              >
                <div className="flex items-center text-4xl font-bold text-[var(--color-success)]">
                  {displayUsdMode ? <CurrencyDollarIcon className="w-8 h-8 mr-2" /> : null}
                  {formatPaymentDisplay(BigInt(data?.payment || "0"))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Participants Section - Full Width */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
          <CardHeader className="p-6">
            <CardTitle className="text-2xl text-[var(--color-primary-content)]">Participants</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[var(--color-primary)]/20 rounded-lg">
                <p className="font-semibold text-lg mb-2 text-[var(--color-primary-content)]">Client</p>
                <p className="text-[var(--color-skeleton)] font-mono text-base bg-[var(--color-input)]/20 p-2 rounded">
                  {data.client}
                </p>
              </div>
              {data.freelancer && (
                <div className="p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <p className="font-semibold text-lg mb-2 text-[var(--color-primary-content)]">Freelancer</p>
                  <p className="text-[var(--color-skeleton)] font-mono text-base bg-[var(--color-input)]/20 p-2 rounded">
                    {data.freelancer}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Job Details */}
          <div className="space-y-8">
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-[var(--color-primary-content)]">Job Description</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="bg-[var(--color-primary)]/30 p-6 rounded-lg">
                  <p className="text-[var(--color-primary-content)] leading-relaxed text-lg">{data.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-[var(--color-primary-content)]">Timeline & Duration</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <div className="p-3 bg-[var(--color-accent)] rounded-full">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-[var(--color-primary-content)]">Duration</p>
                    <p className="text-[var(--color-skeleton)] text-base">{formatDurationHours(data.jobDuration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <div className="p-3 bg-[var(--color-info)] rounded-full">
                    <CalendarDaysIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-[var(--color-primary-content)]">Deadline</p>
                    <p className="text-[var(--color-skeleton)] text-base">
                      {data.state === JobStateEnum.WaitingForApproval
                        ? "Deadline not yet defined"
                        : formatDate(String(data.deadline))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-[var(--color-primary-content)]">Delivery Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="flex justify-between items-center p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <span className="text-base font-semibold text-[var(--color-primary-content)]">
                    Freelancer Delivered
                  </span>
                  <Badge
                    variant={data.freelancerDelivered ? "default" : "secondary"}
                    className={
                      data.freelancerDelivered
                        ? "bg-[var(--color-success)] text-[var(--color-primary-content)]"
                        : "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]"
                    }
                  >
                    {data.freelancerDelivered ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <span className="text-base font-semibold text-[var(--color-primary-content)]">Client Received</span>
                  <Badge
                    variant={data.clientReceived ? "default" : "secondary"}
                    className={
                      data.clientReceived
                        ? "bg-[var(--color-success)] text-[var(--color-primary-content)]"
                        : "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]"
                    }
                  >
                    {data.clientReceived ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Job Roadmap */}
          <div className="space-y-8">
            <JobRoadmap job={data} />
          </div>
        </div>

        {/* Action Buttons */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
          <CardContent className="p-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <p className="font-semibold text-lg text-[var(--color-primary-content)]">Job ID: {data.jobId}</p>
                <p className="text-base text-[var(--color-skeleton)]">Posting ID: {data.postingId}</p>
              </div>
              {getActionButtons()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
