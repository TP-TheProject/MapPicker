export const APP_MODE = {
  FREE: "free",
  VETO: "veto",
} as const;

export type AppMode = (typeof APP_MODE)[keyof typeof APP_MODE];
