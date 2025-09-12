export interface UniversalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** URL of the banner image for the card. */
  bannerUrl?: string;
  /** Address of the user avatar for the card. */
  avatarAddress?: string;
  /** Custom avatar element for the card. */
  customAvatar?: React.ReactNode;
  /** Variant of the card, either reduced or complete. */
  cardVariant?: string;
  /** Title of the card. */
  title?: string;
  /** Description of the card. */
  description?: string;
  /** Extra information about the card. */
  extraInfo?: React.ReactNode;
  /** Category on the card. */
  category?: string;
  /** Rating on the card, displayed as stars. */
  rating?: number;
  /** Time information for the card. */
  time?: string | number;
  /** Label for the time information. */
  timeLabel?: string;
  /** Display component for payment information. */
  paymentDisplay?: React.ReactNode;
  /** Left content for the card footer. */
  footerLeft?: React.ReactNode;
  /** Right content for the card footer. */
  footerRight?: React.ReactNode;
  /** If true, highlights the card (e.g., for emphasis). */
  highlight?: boolean;
}
