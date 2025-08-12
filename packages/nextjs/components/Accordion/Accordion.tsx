import * as React from "react";
import { AccordionProps } from "./types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MUIAccordion from "@mui/material/Accordion";
import MUIAccordionDetails from "@mui/material/AccordionDetails";
import MUIAccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";

export default function Accordion(props: AccordionProps) {
  return (
    <MUIAccordion
      sx={{
        width: "100%",
        backgroundColor: "var(--color-surface)",
        "& .MuiSvgIcon-root": { color: "var(--color-primary-content)" },
      }}
    >
      <MUIAccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${props.title}-content`}
        id={`${props.title}-header`}
      >
        <Typography component="span" className="text-primary-content">
          {props.title}
        </Typography>
      </MUIAccordionSummary>
      <MUIAccordionDetails>{props.children}</MUIAccordionDetails>
    </MUIAccordion>
  );
}
