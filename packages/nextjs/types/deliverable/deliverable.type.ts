export class Deliverable {
  resource: string;
  uploadedAt: string;
  submissionComment?: string;
  clientResponse?: string;
  responseTimestamp?: string;
  isLink: boolean;

  constructor(
    resource: string,
    uploadedAt: string,
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
  }
}

export interface DeliverableData {
  deliverables: Deliverable[];
}
