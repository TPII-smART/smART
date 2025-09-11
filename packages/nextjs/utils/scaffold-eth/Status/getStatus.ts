import { GigState, JobState } from "@se-2/common";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Gig } from "~~/types/gig/gig.types";
import { Job } from "~~/types/job/job.types";

export function getJobStatus(jobStatus: JobState, job: Job, isFreelancer: boolean, isClient: boolean) {
  if (jobStatus === JobState.WaitingForApproval) {
    return {
      label: "Waiting for Approval",
      color: "bg-amber-500",
      icon: ClockIcon,
      description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
    };
  }

  if (jobStatus === JobState.Ongoing) {
    // Check delivery status for ongoing jobs
    if (job.freelancerCancelled) {
      return {
        label: "Cancellation Pending",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: isFreelancer ? "You cancelled the job" : "Job was cancelled by freelancer",
      };
    } else if (job.clientCancelled) {
      return {
        label: isClient ? "You cancelled the job" : "Cancelled by Client",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: isClient ? "You cancelled the job" : "Job was cancelled by client",
      };
    }

    if (job.freelancerDelivered && job.clientReceived) {
      return {
        label: "Completed - Awaiting Payment",
        color: "bg-blue-500",
        icon: CheckCircleIcon,
        description: "Work delivered and received",
      };
    } else if (job.freelancerDelivered && !job.clientReceived) {
      return {
        label: "Delivered - Awaiting Review",
        color: "bg-purple-500",
        icon: PaperAirplaneIcon,
        description: "Work delivered, awaiting client review",
      };
    } else if (!job.freelancerDelivered && job.clientReceived) {
      return {
        label: "In Progress - Client Ready",
        color: "bg-green-500",
        icon: PlayIcon,
        description: "Client ready, awaiting delivery",
      };
    } else {
      return {
        label: "In Progress",
        color: "bg-green-500",
        icon: PlayIcon,
        description: "Work in progress",
      };
    }
  }

  if (jobStatus === JobState.Finished) {
    return {
      label: "Completed",
      color: "bg-emerald-500",
      icon: CheckCircleIcon,
      description: "Job successfully completed",
    };
  }

  if (jobStatus === JobState.Cancelled) {
    return {
      label: "Cancelled",
      color: "bg-red-500",
      icon: XCircleIcon,
      description: "Job was cancelled",
    };
  }

  return {
    label: "Unknown",
    color: "bg-gray-500",
    icon: ExclamationTriangleIcon,
    description: "Unknown status",
  };
}

export function getGigStatus(gigState: GigState, gig: Gig, isFreelancer: boolean, isClient: boolean) {
  if (gigState === GigState.InProgress) {
    // Check delivery status for ongoing gigs

    if (gig.freelancerCancelled) {
      return {
        label: "Cancellation Pending",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: isFreelancer ? "You cancelled the gig" : "Gig was cancelled by freelancer",
      };
    } else if (gig.clientCancelled) {
      return {
        label: "Cancellation Pending",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: isClient ? "You cancelled the gig" : "Gig was cancelled by client",
      };
    }
    if (gig.freelancerDelivered && gig.clientReceived) {
      return {
        label: "Completed - Awaiting Payment",
        color: "bg-blue-500",
        icon: CheckCircleIcon,
        description: "Work delivered and received",
      };
    } else if (gig.freelancerDelivered && !gig.clientReceived) {
      return {
        label: "Delivered - Awaiting Review",
        color: "bg-purple-500",
        icon: PaperAirplaneIcon,
        description: "Work delivered, awaiting client review",
      };
    } else if (!gig.freelancerDelivered && gig.clientReceived) {
      return {
        label: "In Progress - Client Ready",
        color: "bg-green-500",
        icon: PlayIcon,
        description: "Client ready, awaiting delivery",
      };
    } else {
      return {
        label: "In Progress",
        color: "bg-green-500",
        icon: PlayIcon,
        description: "Work in progress",
      };
    }
  }

  if (gigState === GigState.Completed) {
    return {
      label: "Completed",
      color: "bg-emerald-500",
      icon: CheckCircleIcon,
      description: "Gig successfully completed",
    };
  }

  if (gigState === GigState.Cancelled) {
    return {
      label: "Cancelled",
      color: "bg-red-500",
      icon: XCircleIcon,
      description: "Gig was cancelled",
    };
  }

  return {
    label: "Unknown",
    color: "bg-gray-500",
    icon: ExclamationTriangleIcon,
    description: "Unknown status",
  };
}
