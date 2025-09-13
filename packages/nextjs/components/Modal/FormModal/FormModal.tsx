import Modal from "../Modal";
import { FormModalProps } from "./types";
import { Form, Formik, FormikProps, FormikValues } from "formik";
import Button from "~~/components/Button/Button";

const FormModal = <T extends FormikValues>({ translations, formikProps, children, modalProps }: FormModalProps<T>) => {
  return (
    <Modal {...modalProps}>
      <Formik {...formikProps} enableReinitialize={true}>
        {(formik: FormikProps<T>) => (
          <Form>
            {children(formik)}
            {!modalProps.hideDefaultButtons && (
              <div className="flex justify-between mt-4 max-h-[54px]">
                <Button onClick={modalProps.onClose} variant="outline">
                  {translations?.cancelLabel || "Cancel"}
                </Button>
                <Button
                  disabled={modalProps.loading || formik.isSubmitting}
                  loading={modalProps.loading || formik.isSubmitting}
                  variant="primary"
                  type="submit"
                >
                  {translations?.submitLabel || "Submit"}
                </Button>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default FormModal;
