/**
 * Archivo: common/audit-log.ts.
 * Descripción: Módulo de auditoría de seguridad para registrar eventos críticos del sistema.
 * ¿Para qué? Cumplir OWASP A09 (Security Logging and Monitoring Failures). Un sistema sin
 *   logs de seguridad no puede detectar ni responder a incidentes.
 * ¿Impacto? Permite rastrear actividad sospechosa: intentos de login fallidos, cambios de
 *   contraseña, etc. — esencial para auditorías y forense.
 * ¿Por qué funciones sueltas y no un servicio inyectable? No hay estado ni dependencias que
 *   inyectar (solo console.warn) — un provider de Nest aquí sería una abstracción sin uso real.
 */

type AuditEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'EMAIL_VERIFIED';

interface AuditLogEntry {
  timestamp: string;
  event: AuditEvent;
  userId?: string;
  ip?: string;
  reason?: string;
}

// ¿Qué? Usa console.warn para diferenciarlo de logs de debug y errores de aplicación.
function writeAuditLog(entry: AuditLogEntry): void {
  console.warn('[AUDIT]', JSON.stringify(entry));
}

export function logLoginSuccess(userId: string, ip: string): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    event: 'LOGIN_SUCCESS',
    userId,
    ip,
  });
}

// ¿Qué? El campo reason es genérico — nunca revela si fue "email no encontrado" o
//   "contraseña incorrecta" para evitar user enumeration en los logs.
export function logLoginFailed(reason: string, ip?: string): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    event: 'LOGIN_FAILED',
    reason,
    ip,
  });
}

export function logPasswordChanged(userId: string): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    event: 'PASSWORD_CHANGED',
    userId,
  });
}

// ¿Qué? No registra el email concreto para no facilitar enumeración de usuarios en logs.
export function logPasswordResetRequested(): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    event: 'PASSWORD_RESET_REQUESTED',
  });
}

export function logEmailVerified(userId: string): void {
  writeAuditLog({
    timestamp: new Date().toISOString(),
    event: 'EMAIL_VERIFIED',
    userId,
  });
}
