export class FileFormData {
  file?: File;
  submissionComment: string;

  constructor() {
    this.file = undefined;
    this.submissionComment = "";
  }
}
