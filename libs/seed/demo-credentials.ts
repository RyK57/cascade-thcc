export const DEMO_ACCOUNT_DEFAULTS = {
  email: "demo@prototype.local",
  password: "PrototypeDemo123!",
  fullName: "Demo User",
} as const;

export function getDemoCredentials() {
  return {
    email: process.env.DEMO_ACCOUNT_EMAIL?.trim() || DEMO_ACCOUNT_DEFAULTS.email,
    password:
      process.env.DEMO_ACCOUNT_PASSWORD?.trim() || DEMO_ACCOUNT_DEFAULTS.password,
    fullName:
      process.env.DEMO_ACCOUNT_NAME?.trim() || DEMO_ACCOUNT_DEFAULTS.fullName,
  };
}
