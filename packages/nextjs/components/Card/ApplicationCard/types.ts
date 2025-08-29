import { Application } from "~~/types/gig/gig.types";

export interface ApplicationProps {
  application: Application;
  client: `0x${string}` | undefined;
  className?: string;
  reload?: () => Promise<void>;
}
