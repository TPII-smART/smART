export type CustomerProps = {
  /**
   * The address of the customer.
   */
  address: string;
  /**
   * The current status of the job.
   * Can be "ongoing", "finished", or "cancelled".
   */
  jobStatus: "ongoing" | "finished" | "cancelled";
  /**
   * Optional tags associated with the customer.
   * Used for categorization or additional information.
   */
  tags?: string[];
  /**
   * Optional flag indicating if the customer is verified.
   * Used to signify trustworthiness or authenticity.
   */
  isVerified?: boolean;
  /**
   * Optional number of followers the customer has.
   * Can be used to indicate popularity or influence.
   */
  followers?: number;
};
