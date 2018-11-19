'use strict';

import { Context, crossValidationFn, OpConfig, JobConfig, ValidatedJobConfig } from './interfaces';
import convict from 'convict';
import cloneDeep from 'lodash.clonedeep';
import { validateJobConfig, validateOpConfig } from './config-validators';
import { jobSchema } from './job-schemas';
import { OperationLoader } from './operation-loader';
import { registerApis } from './register-apis';
import { OperationModule } from './operations';

export class JobValidator {
    public schema: convict.Schema<any>;
    private readonly context: Context;
    private readonly opLoader: OperationLoader;

    constructor(context: Context, options: { terasliceOpPath?: string } = {}) {
        this.context = context;
        this.opLoader = new OperationLoader({
            terasliceOpPath: options.terasliceOpPath,
            assetPath: context.sysconfig.teraslice.assets_directory,
        });
        this.schema = jobSchema(context);
    }

    validateConfig(_jobConfig: JobConfig): ValidatedJobConfig {
        // top level job validation occurs, but not operations
        const jobConfig = validateJobConfig(this.schema, cloneDeep(_jobConfig));
        const assetIds = jobConfig.assets || [];
        const apis = {};

        type validateJobFn = (job: ValidatedJobConfig) => void;
        const validateJobFns: validateJobFn[] = [];

        const handleModule = (opConfig: OpConfig, op: OperationModule) => {
            const { Schema, API } = op;

            if (API != null) {
                apis[opConfig._op] = API;
            }

            const schema = new Schema(this.context);

            validateJobFns.push((job) => {
                if (!schema.validateJob) return;
                schema.validateJob(job);
            });

            return schema.validate(opConfig);
        };

        jobConfig.operations = jobConfig.operations.map((opConfig, index) => {
            if (index === 0) {
                return handleModule(opConfig, this.opLoader.loadReader(opConfig._op, assetIds));
            }

            return handleModule(opConfig, this.opLoader.loadProcessor(opConfig._op, assetIds));
        });

        registerApis(this.context, jobConfig);

        validateJobFns.forEach((fn) => { fn(jobConfig); });

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
        let validJob = cloneDeep(job);

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
