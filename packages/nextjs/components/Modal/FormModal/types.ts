import { ModalProps } from "../types";
import { FormikConfig, FormikProps, FormikValues } from "formik";

export interface FormModalTranslations {
  cancelLabel: string;
  submitLabel: string;
}

export type FormModalProps<T extends FormikValues> = {
  /**
   * Formik configuration props for the form.
   */
  formikProps: FormikConfig<T> & { className?: string };
  /**
   * Props for the modal container.
   */
  modalProps: ModalProps;
  /**
   * Optional label for the cancel button.
   */
  translations?: FormModalTranslations;
  children: (props: FormikProps<T>) => React.ReactElement;
};
