/**
 * Archivo: auth/validators/is-different-from.validator.ts.
 * Descripción: Validador cruzado de class-validator — verifica que un campo sea distinto
 *   al valor de otro campo del mismo DTO.
 * ¿Para qué? Rechazar `newPassword === currentPassword` en change-password, igual que el
 *   `.refine()` de zod en el sistema de referencia.
 * ¿Impacto? Sin esta validación cruzada, un usuario podría "cambiar" su contraseña sin
 *   cambiarla realmente.
 */

import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function IsDifferentFrom(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isDifferentFrom',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return value !== relatedValue;
        },
        defaultMessage(): string {
          return 'La nueva contraseña no puede ser igual a la actual.';
        },
      },
    });
  };
}
