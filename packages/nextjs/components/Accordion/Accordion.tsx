import * as React from "react";
import { AccordionProps } from "./types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MUIAccordion from "@mui/material/Accordion";
import MUIAccordionDetails from "@mui/material/AccordionDetails";
import MUIAccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";

export default function Accordion({ title, children, defaultExpanded = true }: AccordionProps) {
  return (
    <MUIAccordion
      sx={{
        width: "100%",
        backgroundColor: "var(--color-surface)",
        "& .MuiSvgIcon-root": { color: "var(--color-primary-content)" },
        borderBottom: "1px solid var(--color-border)",
      }}
      defaultExpanded={defaultExpanded}
    >
      <MUIAccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${title}-content`} id={`${title}-header`}>
        <Typography component="span" className="text-primary-content">
          {title}
        </Typography>
      </MUIAccordionSummary>
      <MUIAccordionDetails>{children}</MUIAccordionDetails>
    </MUIAccordion>
  );
}
