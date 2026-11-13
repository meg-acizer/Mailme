import nodemailer from "nodemailer";
import type { SmtpConfig, SendMailParams } from "@/types/mail";
import { assertSafeMailServer } from "./ssrf";

export async function verifySmtpConnection(config: SmtpConfig): Promise<boolean> {
  await assertSafeMailServer(config.host, config.port, "smtp");
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000,
  });

  return await transporter.verify();
}

export async function sendMailViaSmtp(
  config: SmtpConfig,
  params: SendMailParams,
  fromHeader: string
): Promise<{ messageId: string }> {
  await assertSafeMailServer(config.host, config.port, "smtp");
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const info = await transporter.sendMail({
    from: fromHeader,
    to: params.to.join(", "),
    cc: params.cc && params.cc.length > 0 ? params.cc.join(", ") : undefined,
    bcc: params.bcc && params.bcc.length > 0 ? params.bcc.join(", ") : undefined,
    subject: params.subject,
    text: params.text,
    html: params.html,
    replyTo: params.replyTo,
    inReplyTo: params.inReplyTo,
    references: params.references,
  });

  return { messageId: info.messageId };
}
