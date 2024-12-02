import convict from 'convict';
import { cloneDeep, pMap } from '@terascope/utils';
import { Teraslice } from '@terascope/types';
import {
    Context, OpConfig, ValidatedJobConfig
} from './interfaces';
import { validateJobConfig } from './config-validators.js';
import { jobSchema } from './job-schemas.js';
import { OperationLoader } from './operation-loader/index.js';
import { registerApis } from './register-apis.js';
import { OperationAPIConstructor, OperationModule } from './operations/index.js';
import { parseName } from './operation-loader/utlis.js';

function backwardsCompatibleOpNames(
    jobConfig: Teraslice.ValidatedJobConfig
): Teraslice.ValidatedJobConfig{
    const config = cloneDeep(jobConfig);

    config.operations = config.operations.map((op) => {
        const { name } = parseName(op._op);
        op._op = name;
        return op;
    });

    config.apis = config.apis.map((api) => {
        const { name, tag } = parseName(api._name);

        if (tag) {
            api._name = `${name}:${tag}`;
        } else {
            api._name = name;
        }

        return api;
    });

    return config;
}

export class JobValidator {
    public schema: convict.Schema<any>;
    private readonly context: Context;
    private readonly opLoader: OperationLoader;

    constructor(context: Context) {
        this.context = context;
        this.opLoader = new OperationLoader({
            assetPath: context.sysconfig.teraslice.assets_directory,
            validate_name_collisions: true
        });
        this.schema = jobSchema(context);
    }

    /** Validate the job configuration, including the Operations and APIs configuration */
    async validateConfig(
        jobSpec: Partial<Teraslice.JobConfig | Teraslice.JobConfigParams>
    ): Promise<ValidatedJobConfig> {
        // top level job validation occurs, but not operations
        const jobConfig = validateJobConfig(this.schema, cloneDeep(jobSpec));
        const assetIds = jobConfig.assets || [];
        const apis: Record<string, OperationAPIConstructor> = {};

        type ValidateJobFn = (job: ValidatedJobConfig) => void;
        let validateJobFns: ValidateJobFn[] = [];

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

        jobConfig.operations = await pMap(jobConfig.operations, async (opConfig, index) => {
            if (index === 0) {
                return handleModule(
                    opConfig,
                    await this.opLoader.loadReader(opConfig._op, assetIds)
                );
            }

            return handleModule(
                opConfig,
                await this.opLoader.loadProcessor(opConfig._op, assetIds)
            );
        });

        validateJobFns.forEach((fn) => {
            fn(jobConfig);
        });

        validateJobFns = [];

        jobConfig.apis = await pMap(jobConfig.apis, async (apiConfig) => {
            const { Schema } = await this.opLoader.loadAPI(apiConfig._name, assetIds);
            const schema = new Schema(this.context, 'api');

            validateJobFns.push((job) => {
                if (!schema.validateJob) return;
                schema.validateJob(job);
            });

            return schema.validate(apiConfig);
        });

        const backwardsCompatibleJob = backwardsCompatibleOpNames(jobConfig);

        validateJobFns.forEach((fn) => {
            fn(backwardsCompatibleJob);
        });

        registerApis(this.context, jobConfig);

        Object.keys(apis).forEach((name) => {
            const api = apis[name];
            this.context.apis.executionContext.addToRegistry(name, api);
        });

        return jobConfig;
    }

    hasSchema(obj: Record<string, any>, name: string): void {
        if (!obj.schema || typeof obj.schema !== 'function') {
            throw new Error(`${name} needs to have a method named "schema"`);
        } else if (typeof obj.schema() !== 'object') {
            throw new Error(`${name} schema needs to return an object`);
        }
    }
}
