export interface AccordionProps {
  /**
   * The title of the accordion section.
   */
  title: string;
  /**
   * The content of the accordion section.
   */
  children: React.ReactNode;
  /**
   * Whether the accordion section is expanded by default.
   */
  defaultExpanded?: boolean;
}
