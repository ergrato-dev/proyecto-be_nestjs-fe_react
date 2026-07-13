/**
 * Archivo: users/entities/user.entity.ts.
 * Descripción: Entidad TypeORM de la tabla `users` — cuentas del sistema.
 * ¿Para qué? Centralizar el esquema de BD con decoradores TypeORM; es la fuente de verdad
 *   para las migraciones (generadas por diff contra esta entidad).
 * ¿Impacto? Tabla central del sistema — todos los flujos de auth dependen de ella.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ name: 'hashed_password', type: 'varchar', length: 255 })
  hashedPassword!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // ¿Qué? Flag de verificación de email — false hasta que el usuario haga clic en el enlace.
  // ¿Para qué? Garantizar que el email registrado pertenece realmente al usuario (OWASP A07).
  // ¿Impacto? Login retorna 403 si is_email_verified es false.
  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified!: boolean;

  // ¿Qué? Idioma preferido del usuario para la interfaz (i18n).
  // ¿Para qué? Persistir la preferencia de idioma para restaurarla en cualquier dispositivo.
  @Column({ type: 'varchar', length: 10, default: 'es' })
  locale!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  // ¿Qué? TypeORM actualiza esta columna automáticamente en cada repository.save().
  // ¿Para qué? Evitar tener que setearla manualmente en cada update de servicio.
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
