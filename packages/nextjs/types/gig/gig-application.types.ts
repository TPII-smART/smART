import { Gig } from "./gig.types";

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

/** Enum representing the possible states of an application. */
export enum ApplicationState {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}

export interface ApplicationsData {
  applications: Application[];
}
