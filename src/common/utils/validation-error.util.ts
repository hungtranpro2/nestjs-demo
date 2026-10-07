import type { ValidationError } from 'class-validator';

export interface ValidationErrorDetail {
  field: string;
  messages: string[];
}

export function formatValidationErrors(
  errors: ValidationError[],
  parent = '',
): ValidationErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const details: ValidationErrorDetail[] = error.constraints
      ? [{ field, messages: Object.values(error.constraints) }]
      : [];
    return [...details, ...formatValidationErrors(error.children ?? [], field)];
  });
}
