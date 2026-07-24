export const ROUTES = {
  home: "/",
  main: "/main",
  internal: "/internal",
  job: (jobId: string) => `/job/${jobId}` as const,
  /** One-time sign-in link texted into an iMessage thread. */
  accountLink: (token: string) => `/l/${token}` as const,
  auth: {
    login: "/auth/login",
    phone: "/auth/phone",
    signUp: "/auth/sign-up",
    forgotPassword: "/auth/forgot-password",
    updatePassword: "/auth/update-password",
    callback: "/auth/callback",
    error: "/auth/error",
  },
  api: {
    health: "/api/health",
    accountCode: "/api/account/code",
    accountVerify: "/api/account/verify",
    accountSession: "/api/account/session",
    integrationsStatus: "/api/integrations/status",
    linqChats: "/api/linq/chats",
    linqWebhook: "/api/linq/webhook",
    teracOpportunities: "/api/terac/opportunities",
    jobs: "/api/jobs",
    agentWallet: "/api/agent-wallet",
    treasuryBalances: "/api/treasury/balances",
    internalSeedDemoJob: "/api/internal/seed-demo-job",
    internalDemoMetrics: "/api/internal/demo-metrics",
  },
} as const;

export const PROTECTED_ROUTE_PREFIXES = [ROUTES.main, ROUTES.internal] as const;

export const AUTH_ROUTE_PREFIXES = [
  ROUTES.auth.login,
  ROUTES.auth.signUp,
  ROUTES.auth.forgotPassword,
] as const;
