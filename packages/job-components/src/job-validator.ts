import {
    cloneDeep, pMap, get, isNil, has,
    isTest
} from '@terascope/core-utils';
import { Teraslice, Terafoundation } from '@terascope/types';
import { Context, OpConfig, ValidatedJobConfig } from './interfaces';
import { validateJobConfig } from './config-validators.js';
import { jobSchema } from './job-schemas.js';
import { OperationLoader, parseName } from './operation-loader/index.js';
import { registerApis } from './register-apis.js';
import {
    OperationAPIConstructor,
    OperationModule,
} from './operations/index.js';

export class JobValidator {
    public schema: Terafoundation.Schema<any>;
    private readonly context: Context;
    private readonly opLoader: OperationLoader;

    constructor(context: Context) {
        this.context = context;
        this.opLoader = new OperationLoader({
            assetPath: context.sysconfig.teraslice.assets_directory,
            validate_name_collisions: true,
        });
        this.schema = jobSchema(context);
    }

    /** Validate the job configuration, including the Operations and APIs configuration */
    async validateConfig(
        jobSpec: Partial<Teraslice.JobConfig | Teraslice.JobConfigParams>,
    ): Promise<{ jobConfig: ValidatedJobConfig; warnings: Teraslice.JobWarning[] }> {
        // top level job validation occurs, but not operations
        const {
            config: jobConfig,
            warnings: jobWarnings
        } = validateJobConfig(this.schema, cloneDeep(jobSpec), this.context);
        const assetIds = jobConfig.assets || [];
        const apis: Record<string, OperationAPIConstructor> = {};

        type ValidateJobFn = (job: ValidatedJobConfig) => void;
        const validateJobFns: ValidateJobFn[] = [];
        const validateApisFns: ValidateJobFn[] = [];
        const allWarnings: Teraslice.JobWarning[] = [...jobWarnings];
        const opAPIMapping = new Map<string, string>();

        const handleModule = (
            opConfig: OpConfig,
            op: OperationModule,
            index: number,
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

            const opResult = schema.validate(opConfig);
            // TODO: v3 schemas may return the config directly instead of
            // { config, warnings }. Support for the old shape will be dropped in Teraslice v4.
            const validatedConfig = isValidateResult(opResult) ? opResult.config : opResult;
            const warnings = isValidateResult(opResult) ? (opResult.warnings ?? []) : [];
            allWarnings.push(...warnings);

            const needsAPI = has(validatedConfig, '_api_name') || has(validatedConfig, 'api_name');

            if (needsAPI) {
                const apiName = get(validatedConfig, '_api_name', null) ?? get(validatedConfig, 'api_name', null);

                if (isNil(apiName)) {
                    throw new Error('An operation with a _api_name keyword must link it to a valid api configuration on the job');
                }

                opAPIMapping.set(apiName, apiName);
            }

            return validatedConfig;
        };

        // jest has an issues with dynamic imports using node experimental vm
        // so we need to load the operations sequentially in test mode to avoid that issue
        // https://github.com/terascope/standard-assets/issues/861
        const concurrency = isTest ? 1 : jobConfig.operations.length;
        const apiConcurrency = isTest ? 1 : jobConfig.apis.length;

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
                index,
            );
        }, { concurrency },
        );

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

            const apiResult = schema.validate(apiConfig);
            // TODO: v3 schemas may return the config directly instead of
            // { config, warnings }. Support for the old shape will be dropped in Teraslice v4.
            const validatedApiConfig = isValidateResult(apiResult) ? apiResult.config : apiResult;
            const apiWarnings = isValidateResult(apiResult) ? (apiResult.warnings ?? []) : [];
            allWarnings.push(...apiWarnings);
            return validatedApiConfig;
        });

        // this can mutate the job
        validateApisFns.forEach((fn) => {
            fn(jobConfig);
        }, { concurrency: apiConcurrency });

        const apiNames = jobConfig.apis.map((api) => api._name);

        for (const [key] of opAPIMapping.entries()) {
            if (!apiNames.includes(key)) {
                throw new Error(`Could not find the associated api for ${key}`);
            }
        }

        validateJobFns.forEach((fn) => {
            fn(jobConfig);
        });

        registerApis(this.context, jobConfig);

        Object.keys(apis).forEach((name) => {
            const api = apis[name];
            this.context.apis.executionContext.addToRegistry(name, api);
        });

        await this._applyRelocatable(jobConfig);

        return { jobConfig, warnings: allWarnings };
    }

    /**
     * Loads the slicer for the given job to determine if it is relocatable,
     * then sets that value as a property on the jobConfig so it is persisted
     * on the EX record. The K8s backend reads this property to apply the
     * appropriate pod label.
     */
    private async _applyRelocatable(jobConfig: ValidatedJobConfig): Promise<void> {
        try {
            const readerModule = await this.opLoader.loadReader(
                jobConfig.operations[0]._op,
                jobConfig.assets || []
            );
            const slicerInstance = new readerModule.Slicer(
                this.context as any,
                cloneDeep(jobConfig.operations[0]),
                jobConfig as any
            );
            if (typeof slicerInstance.isRelocatable === 'function') {
                jobConfig.relocatable = slicerInstance.isRelocatable();
            }
        } catch (err) {
            this.context.logger.warn(`Unable to determine relocatable for job: ${err}`);
        }
    }

    hasSchema(obj: Record<string, any>, name: string): void {
        if (!obj.schema || typeof obj.schema !== 'function') {
            throw new Error(`${name} needs to have a method named "schema"`);
        } else if (typeof obj.schema() !== 'object') {
            throw new Error(`${name} schema needs to return an object`);
        }
    }
}

/**
 * The shape returned by new-style schema validate() methods.
 *
 * @backwards-compat: v3 schemas return the config directly instead of this shape.
 * Support for the old shape will be dropped in Teraslice v4.
 */
type ValidateResult = { config: any; warnings: Teraslice.JobWarning[] };

/**
 * Type guard to distinguish new-style schema validate() results (ValidateResult)
 * from old-style results (plain config object).
 *
 * @backwards-compat: v3 schemas return the config directly. This guard exists to
 * support both shapes during the deprecation window. Will be removed in Teraslice v4
 * when all schemas are required to return { config, warnings }.
 */
function isValidateResult(result: any): result is ValidateResult {
    // Check for both 'config' and 'warnings' to avoid false positives on legacy op
    // configs that happen to have a 'config' property.
    return result != null
        && typeof result === 'object'
        && 'config' in result
        && typeof result.config === 'object'
        && 'warnings' in result
        && Array.isArray(result.warnings);
}
