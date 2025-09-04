import { Tab } from "~~/components/Tabs/types";

export class FileFormData {
  file?: File;
  link?: string;
  submissionComment: string;
  isLink: boolean;

  constructor() {
    this.file = undefined;
    this.link = "";
    this.submissionComment = "";
    this.isLink = false;
  }
}

export type UploadTab = "file" | "link";

export const tabs: Tab[] = [
  { id: "file", label: "File" },
  { id: "link", label: "Link" },
];
