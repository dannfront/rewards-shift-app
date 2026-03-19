export const parseCookies = (setCookieHeader: string[] | undefined) =>
  setCookieHeader?.map((c) => c.split(';')[0]).join('; ') ?? '';
