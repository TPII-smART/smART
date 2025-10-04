import { Talent } from "~~/types/hiredTalent";

export interface TalentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  talent?: Talent;
  reload?: () => Promise<void>;
}
