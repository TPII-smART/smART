export interface ModalProps {
  /**
   * Optional title for the modal.
   */
  title?: string;
  /**
   * Optional description for the modal.
   */
  description?: string;
  /**
   * Whether the modal is currently open.
   */
  isOpen: boolean;
  /**
   * Callback function to be called when the modal is closed.
   */
  onClose?: () => void;
  /**
   * Callback function to be called when the form is submitted.
   * Only applicable if variant is "form".
   */
  onSubmit?: () => void;
  /**
   * Optional variant for the modal, can be "form" or "custom".
   */
  variant?: "form" | "custom";
  /**
   * Optional children to be rendered inside the modal.
   */
  children?: React.ReactNode;
  /**
   * Optional loading state for the modal, used to indicate processing.
   */
  loading?: boolean;
}
