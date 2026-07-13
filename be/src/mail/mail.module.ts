/**
 * Archivo: mail/mail.module.ts.
 * Descripción: Módulo que expone MailService al resto de la aplicación.
 * ¿Para qué? Encapsular la dependencia de nodemailer detrás de un provider inyectable.
 */

import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
