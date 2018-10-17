'use strict';

import { Context, crossValidationFn, OpConfig, JobConfig, ValidatedJobConfig } from '@terascope/teraslice-types';
import convict from 'convict';
import _ from 'lodash';
import { validateJobConfig, validateOpConfig } from './config-validators';
import { jobSchema } from './job-schemas';
import { LoaderOptions, OperationLoader } from './operation-loader';
import { registerApis } from './register-apis';

export class JobValidator {
    public schema: convict.Schema<any>;
    private readonly context: Context;
    private readonly opLoader: OperationLoader;

    constructor(context: Context, options: LoaderOptions) {
        this.context = context;
        this.opLoader = new OperationLoader(options);
        this.schema = jobSchema(context);
    }

    validateConfig(_jobConfig: JobConfig): ValidatedJobConfig {
        // top level job validation occurs, but not operations
        const jobConfig = validateJobConfig(this.schema, _.cloneDeep(_jobConfig));
        const apis = {};

        jobConfig.operations = jobConfig.operations.map((opConfig, index) => {
            if (index === 0) {
                const { Schema, API } = this.opLoader.loadReader(opConfig._op);
                apis[opConfig._op] = API;
                return new Schema(this.context).validate(opConfig);
            }

            const { Schema, API } = this.opLoader.loadProcessor(opConfig._op);
            apis[opConfig._op] = API;
            return new Schema(this.context).validate(opConfig);
        });

        registerApis(this.context, jobConfig);

        Object.keys(apis).forEach((name) => {
            const api = apis[name];
            this.context.apis.executionContext.addToRegistry(name, api);
        });

        // @ts-ignore
        return jobConfig;
    }

    /**
     * Validate Legacy Jobs
     * DEPRECATED to accommadate for new Job APIs,
     * use validateConfig
    */
    validate(job: any) {
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

        registerApis(this.context, job);

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
