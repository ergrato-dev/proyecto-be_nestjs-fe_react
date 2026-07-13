/**
 * Archivo: database/entities.ts.
 * Descripción: Lista única de entidades TypeORM, compartida entre el DataSource de la CLI
 *   (migraciones) y el TypeOrmModule de Nest (runtime).
 * ¿Para qué? Evitar que ambas listas diverjan — una sola fuente de verdad.
 */

import { User } from '../users/entities/user.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';

export const entities = [User, EmailVerificationToken, PasswordResetToken];
