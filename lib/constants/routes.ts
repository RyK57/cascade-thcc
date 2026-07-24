export const ROUTES = {
  home: "/",
  main: "/main",
  internal: "/internal",
  auth: {
    login: "/auth/login",
    signUp: "/auth/sign-up",
    forgotPassword: "/auth/forgot-password",
    updatePassword: "/auth/update-password",
    callback: "/auth/callback",
    error: "/auth/error",
  },
  api: {
    health: "/api/health",
    integrationsStatus: "/api/integrations/status",
    linqChats: "/api/linq/chats",
    teracOpportunities: "/api/terac/opportunities",
  },
} as const;

export const PROTECTED_ROUTE_PREFIXES = [ROUTES.main, ROUTES.internal] as const;

export const AUTH_ROUTE_PREFIXES = [
  ROUTES.auth.login,
  ROUTES.auth.signUp,
  ROUTES.auth.forgotPassword,
] as const;
