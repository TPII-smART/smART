export interface ModalProps {
  /**
   * Optional title for the modal.
   */
  title?: string;
  /**
   * Optional description for the modal.
   */
  description?: string | React.ReactNode;
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  /**
   * Callback function to be called when the modal is closed.
   */
  onClose?: () => void;
  /**
   * Optional variant for the modal, can be "form" or "custom".
   */
  variant?: "custom";
  /**
   * Optional children to be rendered inside the modal.
   */
  children?: React.ReactNode;
  /**
   * Optional loading state for the modal, used to indicate processing.
   */
  loading?: boolean;
  /**
   * Optional flag to hide the default action buttons (Cancel and Submit).
   */
  hideDefaultButtons?: boolean;
  /**
   * Optional width for the modal.
   */
  width?: string | number;
  /**
   * Optional blocking flag for the modal, making it non-dismissible.
   */
  blocking?: boolean;
}
