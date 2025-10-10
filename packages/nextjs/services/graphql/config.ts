export const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export type Schemas = "hiredTalent" | "talent" | "gig" | "gigApplication" | "userProfile" | "notification";
