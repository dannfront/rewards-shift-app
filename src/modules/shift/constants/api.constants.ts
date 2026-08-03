export const SHIFT_API = {
  BASE_URL: 'https://shift.gearboxsoftware.com',
  HOME: '/home',
  SESSIONS: '/sessions',
  REWARDS: '/rewards',
  ENTITLEMENT_OFFER_CODES: '/entitlement_offer_codes',
  CODE_REDEMPTIONS: '/code_redemptions',
} as const;

export const SHIFT_HEADERS = {
  CONTENT_TYPE: 'application/x-www-form-urlencoded',
  X_REQUESTED_WITH: 'XMLHttpRequest',
  ACCEPT: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  REFERER: 'https://shift.gearboxsoftware.com/rewards',
  ORIGIN: 'https://shift.gearboxsoftware.com',
} as const;
