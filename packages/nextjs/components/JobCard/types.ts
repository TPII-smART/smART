export interface UniversalJobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** URL of the banner image for the job card. */
  bannerUrl?: string;
  /** Address of the user avatar for the job card. */
  avatarAddress?: string;
  /** Title of the job card. */
  title?: string;
  /** Description of the job card. */
  description?: string;
  /** Category of the job card. */
  category?: string;
  /** Rating of the job card, displayed as stars. */
  rating?: number;
  /** Display component for payment information. */
  paymentDisplay?: React.ReactNode;
  /** Left content for the job card footer. */
  footerLeft?: React.ReactNode;
  /** Right content for the job card footer. */
  footerRight?: React.ReactNode;
}
