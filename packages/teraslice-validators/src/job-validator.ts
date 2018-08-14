'use strict';

import * as _ from 'lodash';
import * as convict from 'convict';
import { Context, OpConfig, crossValidation } from '@terascope/teraslice-types';
import { OperationLoader, LoaderOptions } from '@terascope/teraslice-operations';
import { opSchema, jobSchema } from './job-schemas';
import { validateJobConfig, validateOpConfig } from './config-validators';

export class JobValidator {
    private readonly context: Context;
    private readonly opLoader: OperationLoader;
    schema: convict.Schema<any>;

    constructor(context: Context, options: LoaderOptions) {
        this.context = context;
        this.opLoader = new OperationLoader(options);
        this.schema = jobSchema(context);
    }

    validate(job: any) {
        let validJob = _.cloneDeep(job);

        // this is used if an operation needs to provide additional validation beyond its own scope
        const topLevelJobValidators : crossValidation[] = [];

        // top level job validation occurs, but not operations
        validJob = validateJobConfig(this.schema, validJob);

        validJob.operations = job.operations.map((opConfig: OpConfig) => {
            const operation = this.opLoader.load(opConfig._op, job.assets);

            this.hasSchema(operation, opConfig._op);

            const validOP = validateOpConfig(opSchema, opConfig);

            if (operation.selfValidation) {
                operation.selfValidation(validOP);
            }

            if (operation.crossValidation) {
                topLevelJobValidators.push(operation.crossValidation as crossValidation);
            }

            return validOP;
        });

        topLevelJobValidators.forEach((fn) => {
            fn(validJob, this.context.sysconfig);
        });

        return validJob;
    }

    hasSchema(obj: any, name: string) {
        if (!obj.schema || typeof obj.schema !== 'function') {
            throw new Error(`${name} needs to have a method named "schema"`);
        } else if (typeof obj.schema() !== 'object') {
            throw new Error(`${name} schema needs to return an object`);
        }
    }
}
