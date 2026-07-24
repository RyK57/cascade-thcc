export function getDynamicEnvironmentId(): string | undefined {
  return process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim() || undefined;
}

export function isDynamicConfigured(): boolean {
  return Boolean(getDynamicEnvironmentId());
}
