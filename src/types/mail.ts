export type EmailProvider = "google" | "microsoft" | "imap_smtp";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for 587/STARTTLS
  user: string;
  pass: string;
}

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface AccountCredentials {
  provider: EmailProvider;
  email: string;
  displayName: string;
  colorTag: string;
  // For IMAP/SMTP accounts
  imap?: ImapConfig;
  smtp?: SmtpConfig;
  // For OAuth accounts (Google / Microsoft)
  oauth?: {
    accessToken?: string;
    refreshToken: string;
    expiresAt?: number;
  };
}

export interface SendMailParams {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    size?: number;
    contentType?: string;
  }>;
}

export interface ParsedEmailMessage {
  remoteMsgId: string;
  threadId?: string;
  fromAddress: string;
  fromName: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  date: Date;
  isRead: boolean;
  isFlagged: boolean;
  attachmentsCount: number;
}
