export interface NotificationPayload {
  code: string;
  platform?: string;
}

export interface INotificationService {
  notifyCodeRedeemed(code: string, platform: string): Promise<void>;
  notifyCodeFailed(code: string, platform: string): Promise<void>;
  notifyCodeExpired(code: string): Promise<void>;
}
