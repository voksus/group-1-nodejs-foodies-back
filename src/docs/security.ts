export const authenticatedSecurity: Record<string, string[]>[] = [
  { bearerAuth: [] },
  { cookieAuth: [] },
];

export const optionalSecurity: Record<string, string[]>[] = [
  ...authenticatedSecurity,
  {},
];
