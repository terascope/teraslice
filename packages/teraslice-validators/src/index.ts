import { commonSchema, jobSchema } from './schemas/job';

export * from './config';
export const schemas = {
    job: {
        commonSchema,
        jobSchema,
    },
};
