import { cloneDeep, pMap, Schema } from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import { Context, OpConfig, ValidatedJobConfig } from './interfaces';
import { validateJobConfig } from './config-validators.js';
import { jobSchema } from './job-schemas.js';
import { OperationLoader, parseName } from './operation-loader/index.js';
import { registerApis } from './register-apis.js';
import { OperationAPIConstructor, OperationModule } from './operations/index.js';

export class JobValidator {
    public schema: Schema<any>;
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
        const validateJobFns: ValidateJobFn[] = [];
        const validateApisFns: ValidateJobFn[] = [];

        const handleModule = (
            opConfig: OpConfig,
            op: OperationModule,
            index: number
        ) => {
            const { Schema: OpSchema, API } = op;

            if (API != null) {
                apis[opConfig._op] = API;
            }

            const schema = new OpSchema(this.context);

            validateJobFns.push((job) => {
                if (!schema.validateJob) return;

                const originalName = opConfig._op;
                const { name } = parseName(originalName);

                // for backwards compatible checks, alter name so it can be found
                job.operations[index]._op = name;
                schema.validateJob(job);
                // revert name back to original
                job.operations[index]._op = originalName;
            });

            return schema.validate(opConfig);
        };

        jobConfig.operations = await pMap(jobConfig.operations, async (opConfig, index) => {
            if (index === 0) {
                return handleModule(
                    opConfig,
                    await this.opLoader.loadReader(opConfig._op, assetIds),
                    index
                );
            }

            return handleModule(
                opConfig,
                await this.opLoader.loadProcessor(opConfig._op, assetIds),
                index
            );
        });

        // this needs to happen first because it can add apis to the job
        // through usage of the ensureAPIFromConfig api that called inside
        // many validateJob schema methods
        validateJobFns.forEach((fn) => {
            fn(jobConfig);
        });

        jobConfig.apis = await pMap(jobConfig.apis, async (apiConfig, index) => {
            const { Schema: ApiSchema } = await this.opLoader.loadAPI(apiConfig._name, assetIds);
            const schema = new ApiSchema(this.context, 'api');

            validateApisFns.push((job) => {
                if (!schema.validateJob) return;

                const originalName = apiConfig._name;
                const { name } = parseName(originalName);

                // for backwards compatible checks, alter name so it can be found
                job.apis[index]._name = name;
                schema.validateJob(job);
                // revert name back to original
                job.apis[index]._name = originalName;
            });

            return schema.validate(apiConfig);
        });

        // this can mutate the job
        validateApisFns.forEach((fn) => {
            fn(jobConfig);
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
