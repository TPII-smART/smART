import { Gig } from "~~/types/gig/gig.types";

export interface GigCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gig: Gig;
  reload?: () => Promise<void>;
}
