'use strict';

import * as _ from 'lodash';
import { Context, JobConfig, SysConfig } from '@terascope/teraslice-types';
import { OperationLoader } from '@terascope/teraslice-operations';
import { commonSchema, jobSchema } from './job-schemas';
import { validateJobConfig, validateOpConfig } from './config-validators';

interface crossValidation {
    (job: JobConfig, sysconfig: SysConfig) : void;
}

export class JobValidator {
    private readonly context: Context;
    private readonly terasliceOpPath: string;
    private readonly opLoader: OperationLoader;

    constructor(context: Context, terasliceOpPath: string) {
        this.context = context;
        this.terasliceOpPath = terasliceOpPath;
        this.opLoader = new OperationLoader({
            terasliceOpPath: this.terasliceOpPath,
            assetPath: context.sysconfig.teraslice.assets_directory,
        });
    }

    validate(job: JobConfig) {
        let validJob = _.cloneDeep(job);

        // this is used if an operation needs to provide additional validation beyond its own scope
        const topLevelJobValidators : crossValidation[] = [];

        // top level job validation occurs, but not operations
        validJob = validateJobConfig(jobSchema, validJob);

        validJob.operations = job.operations.map((opConfig) => {
            const operation = this.opLoader.load(opConfig._op, job.assets);
            this.hasSchema(operation, opConfig._op);
            const opSchema = _.assign({}, commonSchema, operation.schema());
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
