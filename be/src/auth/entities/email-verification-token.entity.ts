/**
 * Archivo: auth/entities/email-verification-token.entity.ts.
 * Descripción: Entidad TypeORM de la tabla `email_verification_tokens`.
 * ¿Para qué? Gestionar el flujo de verify-email: token enviado por email, válido 24h, uso único.
 * ¿Impacto? Sin esta tabla, los usuarios no pueden verificar su email y no pueden hacer login.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // ¿Qué? Relación con el usuario dueño del token, con borrado en cascada.
  // ¿Para qué? Si se elimina el usuario, sus tokens de verificación pendientes también.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
