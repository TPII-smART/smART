export interface ListItemProps {
  id: string;
  title: string;
  description?: string;
  userProfilePictureURL?: string;
  userAddress?: `0x${string}`;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  href?: string;
}

export interface ListProps<T, Y = Partial<T> & ListItemProps> {
  items: Y[];
  secondaryAction?: (item: Y) => React.ReactNode;
  paddingY?: string | number;
  descriptionLines?: number;
}
