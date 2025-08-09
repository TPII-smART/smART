export interface UniversalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** URL of the banner image for the card. */
  bannerUrl?: string;
  /** Address of the user avatar for the card. */
  avatarAddress?: string;
  /** Title of the card. */
  title?: string;
  /** Description of the card. */
  description?: string;
  /** Extra information about the card. */
  extraInfo?: string;
  /** Category on the card. */
  category?: string;
  /** Rating on the card, displayed as stars. */
  rating?: number;
  /** Display component for payment information. */
  paymentDisplay?: React.ReactNode;
  /** Left content for the card footer. */
  footerLeft?: React.ReactNode;
  /** Right content for the card footer. */
  footerRight?: React.ReactNode;
}
