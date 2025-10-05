import { HiredTalent } from "~~/types/hiredTalent/hiredTalent.types";

export type HiredTalentCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The hiredTalent details.
   * This includes information such as hiredTalent ID,
   * freelancer, client, payment, title, description,
   * category, estimated duration, and various
   * timestamps related to the hiredTalent's lifecycle.
   */
  hiredTalent: HiredTalent;
  /**
   * If true, highlights the card (e.g., for emphasis).
   */
  highlight?: boolean;
};
