import { redirect } from "next/navigation";
import { ListProps } from "./types";
import {
  Avatar as MUIAvatar,
  List as MUIList,
  ListItem as MUIListItem,
  ListItemAvatar as MUIListItemAvatar,
  ListItemButton as MUIListItemButton,
  ListItemText as MUIListItemText,
} from "@mui/material";
import { blo } from "blo";

const List = <T,>({ items, secondaryAction, paddingY = 4, descriptionLines = 3 }: ListProps<T>) => {
  return (
    <MUIList dense sx={{ width: "100%", bgcolor: "transparent" }}>
      {items.map(i => {
        return (
          <MUIListItem
            key={i.id}
            secondaryAction={secondaryAction ? secondaryAction(i) : undefined}
            sx={{
              borderBottom: "1px solid var(--color-border)",
              "& .MuiButtonBase-root": {
                paddingY,
              },
              "& .MuiListItemSecondaryAction-root": {
                width: "15%",
              },
            }}
            disablePadding
            slotProps={{
              root: {
                onClick: i.href ? () => redirect(i.href ?? "#") : i.onClick ? i.onClick : undefined,
              },
            }}
          >
            <MUIListItemButton>
              <MUIListItemAvatar onClick={i.userAddress ? () => redirect(`profile/${i.userAddress}`) : undefined}>
                <MUIAvatar
                  alt={`${i.id} avatar`}
                  src={
                    i.userProfilePictureURL ? i.userProfilePictureURL : i.userAddress ? blo(i.userAddress) : undefined
                  }
                />
              </MUIListItemAvatar>
              <MUIListItemText
                id={i.id}
                primary={<span className="text-primary-content">{i.title}</span>}
                secondary={
                  <span
                    className="text-secondary-content"
                    style={{
                      overflowWrap: "break-word",
                      wordBreak: "break-all",
                      whiteSpace: "pre-line",
                      display: "-webkit-box",
                      WebkitLineClamp: descriptionLines,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {i.description}
                  </span>
                }
              />
            </MUIListItemButton>
          </MUIListItem>
        );
      })}
    </MUIList>
  );
};

export default List;
