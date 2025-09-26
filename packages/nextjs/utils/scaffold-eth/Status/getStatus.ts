import { ApplicationState, GigState, JobState } from "@se-2/common";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PlayIcon,
  ScaleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { castDateToTimestampNum } from "~~/lib/utils";
import { ActivityItemStatus, ActivityItemType, InteractionType } from "~~/types/feed/activityItem.type";
import { Application, Gig } from "~~/types/gig/gig.types";
import { Job } from "~~/types/job/job.types";

export function getJobStatus(jobState: JobState, job: Job, isFreelancer: boolean, isClient: boolean) {
  if (jobState === JobState.WaitingForApproval) {
    return {
      label: "Waiting for Approval",
      color: "bg-amber-500",
      icon: ClockIcon,
      description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
    };
  }

  if (jobState === JobState.Ongoing) {
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

  if (jobState === JobState.Finished) {
    return {
      label: "Completed",
      color: "bg-emerald-500",
      icon: CheckCircleIcon,
      description: "Job successfully completed",
    };
  }

  if (jobState === JobState.Cancelled) {
    return {
      label: "Cancelled",
      color: "bg-red-500",
      icon: XCircleIcon,
      description: "Job was cancelled",
    };
  }

  if (jobState === JobState.Disputed) {
    return {
      label: "In Dispute",
      color: "bg-yellow-500",
      icon: ScaleIcon,
      description: "Job is currently in dispute",
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

  if (gigState === GigState.Disputed) {
    return {
      label: "In Dispute",
      color: "bg-yellow-500",
      icon: ScaleIcon,
      description: "Gig is currently in dispute",
    };
  }

  return {
    label: "Unknown",
    color: "bg-gray-500",
    icon: ExclamationTriangleIcon,
    description: "Unknown status",
  };
}

export function getFeedJobStatus(job: Job, userAddress: string) {
  const isClient = job.client === userAddress;

  switch (job.state) {
    case JobState.WaitingForApproval:
      return {
        title: isClient ? "Service Requested" : "New Service Request Received",
        description: isClient
          ? `You requested the service "${job.title}". Waiting for freelancer approval.`
          : `New service request for "${job.title}".`,
        type: ActivityItemType.application,
        timestamp: castDateToTimestampNum(job.createdAt),
        status: ActivityItemStatus.pending,
        interactionType: InteractionType.job,
      };

    case JobState.Cancelled: {
      const cancelledBy = job.emitBy;
      const client = job.client;
      const freelancer = job.freelancer;

      const cancelledActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.canceledAt),
        status: ActivityItemStatus.cancelled,
        interactionType: InteractionType.job,
      };

      if (cancelledBy === client) {
        if (client === userAddress) {
          return {
            title: "You Cancelled the Job Request",
            description: `You cancelled your request for "${job.title}".`,
            ...cancelledActivity,
          };
        } else if (freelancer === userAddress) {
          return {
            title: "User Cancelled the Job",
            description: `User cancelled the job "${job.title}".`,
            ...cancelledActivity,
          };
        }
      } else if (cancelledBy === freelancer) {
        if (client == userAddress) {
          return {
            title: "Freelancer Cancelled the Job",
            description: `The freelancer cancelled the job "${job.title}".`,
            ...cancelledActivity,
          };
        } else if (freelancer == userAddress) {
          return {
            title: "You Cancelled the Job Request",
            description: `You cancelled your request for "${job.title}".`,
            ...cancelledActivity,
          };
        }
      } else {
        return {
          title: "Job Cancelled",
          description: `The job "${job.title}" was cancelled.`,
          ...cancelledActivity,
        };
      }
    }

    case JobState.Ongoing:
      // Freelancer

      const acceptedActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.acceptedAt),
        status: ActivityItemStatus.accepted,
        interactionType: InteractionType.job,
      };

      const deliveredActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.deliveredAt),
        status: ActivityItemStatus.waitingForReview,
        interactionType: InteractionType.job,
      };

      if (!isClient) {
        if (!job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "You Accepted a New Job",
            description: `You accepted the job "${job.title}". Service is ongoing.`,
            ...acceptedActivity,
          };
        }
        if (job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Waiting for Client Approval",
            description: `You delivered the job "${job.title}". Waiting for client review.`,
            ...deliveredActivity,
          };
        }
      }
      // Client
      if (isClient) {
        if (!job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Freelancer Accepted Your Proposal",
            description: `Your request for "${job.title}" was accepted. Service is ongoing.`,
            ...acceptedActivity,
          };
        }
        if (job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Work Delivered - Awaiting Your Approval",
            description: `The freelancer delivered the job "${job.title}". Please review and approve.`,
            ...deliveredActivity,
          };
        }
      }
      break;

    case JobState.Finished:
      return {
        title: isClient ? "Job Completed" : "You Completed a Job",
        description: isClient ? `The job "${job.title}" has been completed.` : `You completed the job "${job.title}".`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.finishedAt),
        status: ActivityItemStatus.completed,
        interactionType: InteractionType.job,
      };

    case JobState.Disputed:
      return {
        title: "Job in Dispute",
        description: `The job "${job.title}" is in dispute.`,
        type: ActivityItemType.status,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.job,
      };

    default:
      return {
        title: "Unknown Job State",
        description: "Unknown job state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.job,
      };
  }
}

export function getFeedGigStatus(application: Application, userAddress: string) {
  const gig = application.gig;
  const isClient = gig?.client === userAddress;
  const isFreelancer = application.freelancer === userAddress;

  switch (gig?.state) {
    case GigState.Open:
      if (isClient) {
        return {
          title: "Gig Published",
          description: `Your gig "${gig.title}" is published and waiting for freelancer proposals.`,
          type: ActivityItemType.status,
          timestamp: castDateToTimestampNum(gig.createdAt),
          status: ActivityItemStatus.pending,
          interactionType: InteractionType.gig,
        };
      }
      break;

    case GigState.InProgress:
      const acceptedActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(gig.acceptedAt),
        status: ActivityItemStatus.accepted,
        interactionType: InteractionType.gig,
      };

      const waitingForApprovalActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(gig.deliveredAt),
        status: ActivityItemStatus.waitingForReview,
        interactionType: InteractionType.gig,
      };

      if (isFreelancer) {
        if (!gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "You Were Selected for a Gig",
            description: `You were chosen to work on "${gig.title}". Start working and deliver when ready.`,
            ...acceptedActivity,
          };
        }
        if (gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "Work Delivered - Awaiting Client Approval",
            description: `You delivered the gig "${gig.title}". Waiting for client review.`,
            ...waitingForApprovalActivity,
          };
        }
      }
      if (isClient) {
        if (!gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "Freelancer Selected",
            description: `You selected a freelancer for "${gig.title}". Work is in progress.`,
            ...acceptedActivity,
          };
        }
        if (gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "Work Delivered by Freelancer",
            description: `The freelancer delivered the gig "${gig.title}". Please review and approve.`,
            ...waitingForApprovalActivity,
          };
        }
      }
      break;

    case GigState.Completed:
      return {
        title: isClient ? "Gig Completed" : "You Completed a Gig",
        description: isClient
          ? `You approved the work for "${gig.title}". The gig is now completed.`
          : `The client approved your work for "${gig.title}". The gig is now completed.`,
        type: ActivityItemType.status,
        status: ActivityItemStatus.completed,
        timestamp: castDateToTimestampNum(gig.finishedAt),
        interactionType: InteractionType.gig,
      };

    case GigState.Cancelled: {
      const client = gig.client?.toLowerCase();
      const freelancer = application.freelancer?.toLowerCase();
      const cancelledBy = gig.emitBy?.toLowerCase();
      const user = userAddress?.toLowerCase();

      const activity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(gig.canceledAt),
        status: ActivityItemStatus.cancelled,
        interactionType: InteractionType.gig,
      };

      if (cancelledBy === client) {
        if (user === client) {
          return {
            title: "You Cancelled the Gig",
            description: `You cancelled your gig "${gig.title}".`,
            ...activity,
          };
        } else if (user === freelancer) {
          return {
            title: "Client Cancelled the Gig",
            description: `The client cancelled the gig "${gig.title}".`,
            ...activity,
          };
        } else if (user === freelancer) {
          return {
            title: "Client Cancelled the Gig",
            description: `The client cancelled the gig "${gig.title}".`,
            ...activity,
          };
        }
      } else if (cancelledBy === freelancer) {
        if (user === client) {
          return {
            title: "Freelancer Cancelled the Gig",
            description: `The freelancer cancelled the gig "${gig.title}".`,
            ...activity,
          };
        } else if (user === freelancer) {
          return {
            title: "You Cancelled the Gig",
            description: `You cancelled your participation in the gig "${gig.title}".`,
            ...activity,
          };
        }
      }

      return {
        title: "Gig Cancelled",
        description: `The gig "${gig.title}" was cancelled.`,
        ...activity,
      };
    }

    default:
      return {
        title: "Unknown Gig State",
        description: "Unknown gig state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.gig,
      };
  }
}

export function getFeedApplicationStatus(application: Application, userAddress: string) {
  const isFreelancer = application.freelancer === userAddress;

  switch (application.state) {
    case ApplicationState.Pending:
      return {
        title: isFreelancer ? "You Applied to a Gig" : "New Application Received",
        description: isFreelancer
          ? `You applied to the gig "${application.gig?.title}". Waiting for client selection.`
          : `A freelancer applied to your gig "${application.gig?.title}".`,
        type: ActivityItemType.application,
        timestamp: castDateToTimestampNum(application.createdAt),
        status: ActivityItemStatus.pending,
        interactionType: InteractionType.gig,
      };

    case ApplicationState.Accepted:
      return getFeedGigStatus(application, userAddress);

    case ApplicationState.Rejected:
      return {
        title: isFreelancer ? "Your Application Was Rejected" : "Application Rejected",
        description: isFreelancer
          ? `Your application for "${application.gig?.title}" was rejected.`
          : `You rejected an application for "${application.gig?.title}".`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(application.rejectAt),
        status: ActivityItemStatus.rejected,
        interactionType: InteractionType.gig,
      };

    default:
      return {
        title: "Unknown Application State",
        description: "Unknown application state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.gig,
      };
  }
}
