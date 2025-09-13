export class Deliverable {
  resource: string;
  uploadedAt: bigint;
  submissionComment?: string;
  clientResponse?: string;
  isLink: boolean;

  constructor(
    resource: string,
    uploadedAt: bigint,
    isLink: boolean,
    submissionComment?: string,
    clientResponse?: string,
  ) {
    this.resource = resource;
    this.uploadedAt = uploadedAt;
    this.submissionComment = submissionComment;
    this.clientResponse = clientResponse;
    this.isLink = isLink;
  }
}

export interface DeliverableData {
  deliverables: Deliverable[];
}
