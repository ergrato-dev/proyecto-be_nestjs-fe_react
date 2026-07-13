/**
 * Archivo: mail/mail.service.ts.
 * Descripción: Servicio de envío de correos electrónicos vía nodemailer.
 * ¿Para qué? Abstraer el envío de emails en un provider inyectable y testeable.
 * ¿Impacto? Si falla, los flujos de verificación de email y recuperación de contraseña
 *   quedan inutilizables — el usuario no puede activar su cuenta ni recuperar acceso.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly mailFrom: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    // ¿Qué? En desarrollo apunta a Mailpit (:1025); en producción debe ser un SMTP real.
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: false,
      ignoreTLS: this.configService.get<string>('NODE_ENV') === 'development',
    });
    this.mailFrom = this.configService.getOrThrow<string>('MAIL_FROM');
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  // ¿Qué? Envía el email de recuperación de contraseña — el enlace expira en 1 hora.
  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    await this.transporter.sendMail({
      from: this.mailFrom,
      to: toEmail,
      subject: 'NN Auth System — Recuperación de contraseña',
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña:\n\n${resetUrl}\n\nEste enlace expira en 1 hora.\nSi no solicitaste este cambio, ignora este mensaje.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperación de contraseña</h2>
          <p>Haz clic en el botón para restablecer tu contraseña:</p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;background:#2563eb;
                    color:#fff;text-decoration:none;border-radius:6px;">
            Restablecer contraseña
          </a>
          <p style="margin-top:16px;color:#6b7280;font-size:14px;">
            Este enlace expira en <strong>1 hora</strong>.<br>
            Si no solicitaste este cambio, ignora este mensaje.
          </p>
        </div>
      `,
    });
  }

  // ¿Qué? Envía el email de verificación de cuenta — el enlace expira en 24 horas.
  // ¿Para qué? Confirmar que el usuario es el propietario real del email antes de
  //   permitirle iniciar sesión.
  async sendVerificationEmail(
    toEmail: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    await this.transporter.sendMail({
      from: this.mailFrom,
      to: toEmail,
      subject: 'NN Auth System — Verifica tu cuenta',
      text: `Haz clic en el siguiente enlace para verificar tu cuenta:\n\n${verificationUrl}\n\nEste enlace expira en 24 horas.\nSi no creaste esta cuenta, ignora este mensaje.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verifica tu cuenta</h2>
          <p>Gracias por registrarte. Haz clic en el botón para activar tu cuenta:</p>
          <a href="${verificationUrl}"
             style="display:inline-block;padding:12px 24px;background:#16a34a;
                    color:#fff;text-decoration:none;border-radius:6px;">
            Verificar cuenta
          </a>
          <p style="margin-top:16px;color:#6b7280;font-size:14px;">
            Este enlace expira en <strong>24 horas</strong>.<br>
            Si no creaste esta cuenta, ignora este mensaje.
          </p>
        </div>
      `,
    });
  }
}
