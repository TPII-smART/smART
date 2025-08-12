import { StaticImport } from "next/dist/shared/lib/get-img-props";

export interface SidebarProps {
  /**
   * Array of items to be displayed in the sidebar
   */
  items?: SidebarItemProps[];
  /**
   * Callback function to be called when the logo is clicked
   */
  onLogoClick?: () => void;
}

export interface SidebarItemProps {
  /**
   * The label of the sidebar item
   */
  label: string;
  /**
   * The icon of the sidebar item
   */
  icon?: React.ElementType;
  /**
   * The href of the sidebar item
   */
  href: string;
  /**
   * Whether the sidebar item is disabled
   */
  disabled?: boolean;
}

export interface SidebarElementProps {
  /**
   * The label of the sidebar element
   */
  label?: string;
  /**
   * The custom label of the sidebar element
   */
  customLabel?: React.JSX.Element;
  /**
   * The image source of the sidebar element
   */
  imgSrc?: string | StaticImport;
  /**
   * The icon of the sidebar element
   */
  icon?: React.ElementType;
  /**
   * Whether the sidebar element is open
   */
  open: boolean;
  /**
   * Callback function to be called when the sidebar element is clicked
   */
  onClick?: () => void;
  /**
   * The href of the sidebar element
   */
  href?: string;
  /**
   * Whether the sidebar element is disabled
   */
  disabled?: boolean;
}
