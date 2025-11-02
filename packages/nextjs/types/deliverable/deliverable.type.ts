// Update the import path to the correct relative location, for example:
import { DeliverableState } from "@se-2/common";

export class Deliverable {
  resource: string;
  uploadedAt: string;
  submissionComment?: string;
  clientResponse?: string;
  responseTimestamp?: string;
  isLink: boolean;
  state: DeliverableState = DeliverableState.Pending;

  constructor(
    resource: string,
    uploadedAt: string,
    state: DeliverableState,
    isLink: boolean,
    submissionComment?: string,
    clientResponse?: string,
    responseTimestamp?: string,
  ) {
    this.resource = resource;
    this.uploadedAt = uploadedAt;
    this.submissionComment = submissionComment;
    this.clientResponse = clientResponse;
    this.responseTimestamp = responseTimestamp;
    this.isLink = isLink;
    this.state = state;
  }
}

export enum AnalysisBadge {
  MATCHS_WITH_DESCRIPTION = "MATCHS WITH DESCRIPTION",
  NEEDS_REVISION = "NEEDS REVISION",
  UNKNOWN = "UNKNOWN",
}

export interface DeliverableAnalysis {
  badge: AnalysisBadge;
  details: string;
}

export interface DeliverableData {
  deliverables: Deliverable[];
}
