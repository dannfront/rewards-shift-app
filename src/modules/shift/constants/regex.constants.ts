export const SHIFT_REGEX = {
  AUTHENTICITY_TOKEN: /name="authenticity_token" value="([^"]+)"/,
  CSRF_TOKEN: /csrf-token" content="([^">]+)"/,
  ARCHWAY_CHECK:
    /<input value="([^"]+)" type="hidden" name="archway_code_redemption\[check\]" id="archway_code_redemption_check" \/>/,
  ARCHWAY_TITLE:
    /<input value="([^"]+)" type="hidden" name="archway_code_redemption\[title\]" id="archway_code_redemption_title" \/>/,
  SERVICE: /value="([^"]+)"[^>]+name="archway_code_redemption\[service\]"/,
} as const;

export const REDDIT_REGEX = {
  SHIFT_CODE: /[A-Z0-9]{5}(?:-[A-Z0-9]{5}){4}/g,
} as const;
