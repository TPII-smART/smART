export interface SidebarProps {
  items?: SidebarItemProps[];
  onLogoClick?: () => void;
}

export interface SidebarItemProps {
  label: string;
  icon?: React.ElementType;
  href: string;
  disabled?: boolean;
}

export interface SidebarElementProps {
  label?: string;
  customLabel?: React.JSX.Element;
  icon?: React.ElementType;
  open: boolean;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}
