import { commonSchema, jobSchema } from './job-schemas';
import { validateJobConfig, validateOpConfig } from './job-validators';

export * from './formats';

export const validators: any = {
    validateJobConfig,
    validateOpConfig,
};

export const schemas: any = {
    commonSchema,
    jobSchema,
};
