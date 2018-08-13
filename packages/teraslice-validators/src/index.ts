import { commonSchema, jobSchema } from './job-schemas';
import { validateJobConfig, validateOpConfig } from './job-validators';

export const validators: any = {
    validateJobConfig,
    validateOpConfig,
};

export const schemas: any = {
    commonSchema,
    jobSchema,
};
