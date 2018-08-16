'use strict';

import { LoaderOptions, OperationLoader } from '@terascope/teraslice-operations';
import { Context, crossValidationFn, OpConfig } from '@terascope/teraslice-types';
import convict from 'convict';
import _ from 'lodash';
import { validateJobConfig, validateOpConfig } from './config-validators';
import { jobSchema, opSchema } from './job-schemas';

export class JobValidator {
    public schema: convict.Schema<any>;
    private readonly context: Context;
    private readonly opLoader: OperationLoader;

    constructor(context: Context, options: LoaderOptions) {
        this.context = context;
        this.opLoader = new OperationLoader(options);
        this.schema = jobSchema(context);
    }

    public validate(job: any) {
        let validJob = _.cloneDeep(job);

        // this is used if an operation needs to provide additional validation beyond its own scope
        const topLevelJobValidators : crossValidationFn[] = [];

        // top level job validation occurs, but not operations
        validJob = validateJobConfig(this.schema, validJob);

        validJob.operations = job.operations.map((opConfig: OpConfig) => {
            const operation = this.opLoader.load(opConfig._op, job.assets);

            this.hasSchema(operation, opConfig._op);

            const validOP = validateOpConfig(operation.schema(), opConfig);

            if (operation.selfValidation) {
                operation.selfValidation(validOP);
            }

            if (operation.crossValidation) {
                topLevelJobValidators.push(operation.crossValidation);
            }

            return validOP;
        });

        topLevelJobValidators.forEach((fn) => {
            fn(validJob, this.context.sysconfig);
        });

        return validJob;
    }

    public hasSchema(obj: any, name: string) {
        if (!obj.schema || typeof obj.schema !== 'function') {
            throw new Error(`${name} needs to have a method named "schema"`);
        } else if (typeof obj.schema() !== 'object') {
            throw new Error(`${name} schema needs to return an object`);
        }
    }
}
