import { ApplicationState, GigState, HiredTalentState } from "@se-2/common";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { castDateToTimestampNum } from "~~/lib/utils";
import { ActivityItemStatus, ActivityItemType, InteractionType } from "~~/types/feed/activityItem.type";
import { Application, Gig } from "~~/types/gig/gig.types";
import { HiredTalent } from "~~/types/hiredTalent/hiredTalent.types";

export function getHiredTalentStatus(
  hiredTalentState: HiredTalentState,
  hiredTalent: HiredTalent,
  isFreelancer: boolean,
  isClient: boolean,
) {
  if (hiredTalentState === HiredTalentState.WaitingForApproval) {
    return {
      label: "Waiting for Approval",
      color: "bg-amber-500",
      icon: ClockIcon,
      description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
    };
  }

  if (hiredTalentState === HiredTalentState.Ongoing) {
    // Check delivery status for ongoing hiredTalents
    if (hiredTalent.freelancerCancelled) {
      return {
        label: "Cancellation Pending",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: isFreelancer ? "You cancelled the hire" : "Hire was cancelled by freelancer",
      };
    } else if (hiredTalent.clientCancelled) {
      return {
        label: isClient ? "You cancelled the hire" : "Cancelled by Client",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: isClient ? "You cancelled the hire" : "Hire was cancelled by client",
      };
    }

    if (hiredTalent.freelancerDelivered && hiredTalent.clientReceived) {
      return {
        label: "Completed - Awaiting Payment",
        color: "bg-blue-500",
        icon: CheckCircleIcon,
        description: "Work delivered and received",
      };
    } else if (hiredTalent.freelancerDelivered && !hiredTalent.clientReceived) {
      return {
        label: "Delivered - Awaiting Review",
        color: "bg-purple-500",
        icon: PaperAirplaneIcon,
        description: "Work delivered, awaiting client review",
      };
    } else if (!hiredTalent.freelancerDelivered && hiredTalent.clientReceived) {
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

  if (hiredTalentState === HiredTalentState.Finished) {
    return {
      label: "Completed",
      color: "bg-emerald-500",
      icon: CheckCircleIcon,
      description: "Hire successfully completed",
    };
  }

  if (hiredTalentState === HiredTalentState.Cancelled) {
    return {
      label: "Cancelled",
      color: "bg-red-500",
      icon: XCircleIcon,
      description: "Hire was cancelled",
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

export function getFeedHiredTalentStatus(hiredTalent: HiredTalent, userAddress: string) {
  const isClient = hiredTalent.client === userAddress;

  switch (hiredTalent.state) {
    case HiredTalentState.WaitingForApproval:
      return {
        title: isClient ? "Service Requested" : "New Service Request Received",
        description: isClient
          ? `You requested the service "${hiredTalent.title}". Waiting for freelancer approval.`
          : `New service request for "${hiredTalent.title}".`,
        type: ActivityItemType.application,
        timestamp: castDateToTimestampNum(hiredTalent.createdAt),
        status: ActivityItemStatus.pending,
        interactionType: InteractionType.hiredTalent,
      };

    case HiredTalentState.Cancelled: {
      const cancelledBy = hiredTalent.emitBy;
      const client = hiredTalent.client;
      const freelancer = hiredTalent.freelancer;

      const cancelledActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(hiredTalent.canceledAt),
        status: ActivityItemStatus.cancelled,
        interactionType: InteractionType.hiredTalent,
      };

      if (cancelledBy === client) {
        if (client === userAddress) {
          return {
            title: "You Cancelled the hire Request",
            description: `You cancelled your request for "${hiredTalent.title}".`,
            ...cancelledActivity,
          };
        } else if (freelancer === userAddress) {
          return {
            title: "User Cancelled the hire",
            description: `User cancelled the hire "${hiredTalent.title}".`,
            ...cancelledActivity,
          };
        }
      } else if (cancelledBy === freelancer) {
        if (client == userAddress) {
          return {
            title: "Freelancer Cancelled the hire",
            description: `The freelancer cancelled the hire "${hiredTalent.title}".`,
            ...cancelledActivity,
          };
        } else if (freelancer == userAddress) {
          return {
            title: "You Cancelled the Hire Request",
            description: `You cancelled your request for "${hiredTalent.title}".`,
            ...cancelledActivity,
          };
        }
      } else {
        return {
          title: "Hire Cancelled",
          description: `The hire "${hiredTalent.title}" was cancelled.`,
          ...cancelledActivity,
        };
      }
    }

    case HiredTalentState.Ongoing:
      // Freelancer

      const acceptedActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(hiredTalent.acceptedAt),
        status: ActivityItemStatus.accepted,
        interactionType: InteractionType.hiredTalent,
      };

      const deliveredActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(hiredTalent.deliveredAt),
        status: ActivityItemStatus.waitingForReview,
        interactionType: InteractionType.hiredTalent,
      };

      if (!isClient) {
        if (!hiredTalent.freelancerDelivered && !hiredTalent.clientReceived) {
          return {
            title: "You Accepted a New Hire",
            description: `You accepted the hire "${hiredTalent.title}". Service is ongoing.`,
            ...acceptedActivity,
          };
        }
        if (hiredTalent.freelancerDelivered && !hiredTalent.clientReceived) {
          return {
            title: "Waiting for Client Approval",
            description: `You delivered the hire "${hiredTalent.title}". Waiting for client review.`,
            ...deliveredActivity,
          };
        }
      }
      // Client
      if (isClient) {
        if (!hiredTalent.freelancerDelivered && !hiredTalent.clientReceived) {
          return {
            title: "Freelancer Accepted Your Proposal",
            description: `Your request for "${hiredTalent.title}" was accepted. Service is ongoing.`,
            ...acceptedActivity,
          };
        }
        if (hiredTalent.freelancerDelivered && !hiredTalent.clientReceived) {
          return {
            title: "Work Delivered - Awaiting Your Approval",
            description: `The freelancer delivered the hiredTalent "${hiredTalent.title}". Please review and approve.`,
            ...deliveredActivity,
          };
        }
      }
      break;

    case HiredTalentState.Finished:
      return {
        title: isClient ? "Hire Completed" : "You Completed a Hire",
        description: isClient
          ? `The hiredTalent "${hiredTalent.title}" has been completed.`
          : `You completed the hiredTalent "${hiredTalent.title}".`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(hiredTalent.finishedAt),
        status: ActivityItemStatus.completed,
        interactionType: InteractionType.hiredTalent,
      };

    case HiredTalentState.Disputed:
      return {
        title: "Hire in Dispute",
        description: `The hire "${hiredTalent.title}" is in dispute.`,
        type: ActivityItemType.status,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.hiredTalent,
      };

    default:
      return {
        title: "Unknown Hire State",
        description: "Unknown hire state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.hiredTalent,
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
