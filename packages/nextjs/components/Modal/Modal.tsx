import { ModalProps } from "./types";

const BaseModal = ({ title, description, children, isOpen, onClose, width, blocking }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-49"
      onMouseDown={() => {
        if (!blocking && onClose) onClose();
      }}
    >
      <div
        style={{ minWidth: width, maxWidth: width }}
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-999
          bg-primary rounded-lg p-6
          shadow-xl border-[1px] border-border
          max-h-[85vh] overflow-auto
        `}
        onMouseDown={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center">{title}</h2>
        <p className="text-lg text-center">{description}</p>
        {children}
      </div>
    </div>
  );
};

const getVariant = (props: ModalProps) => {
  switch (props.variant) {
    default:
      return props.children;
  }
};

const Modal = (props: ModalProps) => {
  return <BaseModal {...props}>{getVariant(props)}</BaseModal>;
};

export default Modal;
