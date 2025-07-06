import Button from "../Button";
import { ModalProps } from "./types";

const BaseModal = ({ title, description, children, isOpen, onClose }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-49" onMouseDown={onClose}>
      <div
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
          bg-primary rounded-lg p-6 w-full max-w-md
          shadow-xl border-[1px] border-border
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
    case "form":
      return (
        <>
          {props.children}
          <div className="flex justify-between mt-4">
            <Button onClick={props.onClose} variant="outline">
              {props.cancelLabel || "Cancel"}
            </Button>
            <Button onClick={props.onSubmit} disabled={props.loading} variant="primary">
              {props.submitLabel || "Submit"}
            </Button>
          </div>
        </>
      );
    case "custom":
      return props.children;
  }
};

const Modal = (props: ModalProps) => {
  return (
    <BaseModal
      title={props.title}
      description={props.description}
      isOpen={props.isOpen}
      variant={props.variant}
      onClose={props.onClose}
    >
      {getVariant(props)}
    </BaseModal>
  );
};

export default Modal;
