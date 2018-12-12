'use strict';

import { Context, OpConfig, JobConfig, ValidatedJobConfig } from './interfaces';
import convict from 'convict';
import { cloneDeep } from './utils';
import { validateJobConfig } from './config-validators';
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

        jobConfig.apis = jobConfig.apis.map((apiConfig) => {
            const { Schema } = this.opLoader.loadAPI(apiConfig._name, assetIds);
            const schema = new Schema(this.context, 'api');

            validateJobFns.push((job) => {
                if (!schema.validateJob) return;
                schema.validateJob(job);
            });

            return schema.validate(apiConfig);
        });

        registerApis(this.context, jobConfig);

        validateJobFns.forEach((fn) => { fn(jobConfig); });

        Object.keys(apis).forEach((name) => {
            const api = apis[name];
            this.context.apis.executionContext.addToRegistry(name, api);
        });

        return jobConfig;
    }

    hasSchema(obj: any, name: string) {
        if (!obj.schema || typeof obj.schema !== 'function') {
            throw new Error(`${name} needs to have a method named "schema"`);
        } else if (typeof obj.schema() !== 'object') {
            throw new Error(`${name} schema needs to return an object`);
        }
    }
}
