import { isNil, getTypeOf } from '@terascope/core-utils';
import { ConvictSchema, ValidatedJobConfig } from '../../../../src/index.js';

const DEFAULT_API_NAME = 'api-asset';

export default class Schema extends ConvictSchema<any, any> {
    validateJob(job: ValidatedJobConfig): void {
        let opIndex = 0;

        const opConfig = job.operations.find((op, ind) => {
            if (op._op === 'reader-asset') {
                opIndex = ind;
                return op;
            }
            return false;
        });

        if (opConfig == null) throw new Error('Could not find reader-asset operation in jobConfig');

        const {
            api_name, field, ...newConfig
        } = opConfig;

        const apiName = api_name || `${DEFAULT_API_NAME}:${opConfig._op}-${opIndex}`;

        // we set the new apiName back on the opConfig so it can reference the unique name
        opConfig.api_name = apiName;

        this.ensureAPIFromConfig(apiName, job, newConfig);

        const testReaderAPI = job.apis.find((jobAPI) => jobAPI._name === apiName);

        if (isNil(testReaderAPI)) throw new Error(`Could not find job api ${apiName}`);

        // we keep these checks here as it pertains to date_reader behavior
        if (isNil(testReaderAPI.version)) {
            throw new Error(`Invalid parameter version, must be of type string, was given ${getTypeOf(opConfig.version)}`);
        }
    }

    build(): Record<string, any> {
        return {
            version: {
                doc: 'my version',
                format: 'required_String',
                default: undefined
            }
        };
    }
}
