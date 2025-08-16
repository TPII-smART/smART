export interface Gig {
  /** Unique identifier for the gig. */
  gigId: string;

  /** Ethereum address of the client who created the gig, formatted as a hexadecimal string. */
  client: `0x${string}`;

  /** (Optional) Ethereum address of the freelancer assigned to the gig, formatted as a hexadecimal string. */
  acceptedFreelancer?: `0x${string}`;

  /** (Optional) Max payment amount or details for the gig. */
  basePayment?: string;

  /** (Optional) Final payment amount or details for the gig. */
  finalPayment?: string;

  /** Title or short summary of the gig. */
  title?: string;

  /** Detailed description of the gig requirements. */
  description?: string;

  /** Category or field of the gig. */
  category?: string;

  /** (Optional) Max time to complete the gig. */
  maxDurationInHours?: string;

  /** (Optional) Final time to complete the gig. */
  finalDurationInHours?: string;

  /** (Optional) ISO date string representing the gig's deadline. */
  deadline?: string | number;

  /** Current state of the gig, represented as an integer. */
  state: number;

  /** (Optional) ISO date string representing when the gig was created. */
  createdAt?: string;

  /** (Optional) ISO date string representing when the gig was accepted by a freelancer. */
  acceptedAt?: string;

  /**
   * (Optional) ISO date string representing when the gig was finished.
   */
  finishedAt?: string;

  /**
   * (Optional) ISO date string representing when the gig was canceled.
   */
  canceledAt?: string;

  /** (Optional) Boolean indicating if the client has marked they received the gig deliverables. */
  clientReceived?: boolean;

  /** (Optional) Boolean indicating if the freelancer has marked they delivered the gig. */
  freelancerDelivered?: boolean;

  /** (Optional) Unique identifier for the accepted application, if applicable. */
  acceptedApplicationId?: string;
}

export interface Application {
  /** Unique identifier for the application. */
  applicationId: string;
  /** Unique identifier for the gig this application is for. */
  gigId: string;
  /** Ethereum address of the freelancer applying for the gig, formatted as a hexadecimal string. */
  freelancer: `0x${string}`;
  /** Proposed payment amount for the gig. */
  proposedPayment: string;
  /** Proposed duration to complete the gig, in hours. */
  proposedDurationInHours: string;
  /** Current state of the application, represented as an integer. */
  state: number;
  /** ISO date string representing when the application was created. */
  createdAt: string;
  /** Comment or message included with the application proposal. */
  proposalComment: string;
  /** (Optional) Comment or message included if the application was rejected. */
  rejectionComment?: string;
  /** (Optional) Gig details associated with the application, if available. */
  gig?: Gig;
}

/** Enum representing the possible states of a gig. */
export enum GigStateEnum {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4,
}

/** Enum representing the possible states of an application. */
export enum ApplicationState {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}
export interface GigsData {
  gigs: Gig[];
}

export interface ApplicationsData {
  applications: Application[];
}
