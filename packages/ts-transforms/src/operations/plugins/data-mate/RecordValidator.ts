/* eslint-disable max-classes-per-file */

import { DataEntity } from '@terascope/utils';
import { RecordValidator } from '@terascope/data-mate';
import { InjectMethod } from '../mixins';
import OperationBase from '../../lib/base';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces';

const RecordValidatorContainer = {} as any;

class Validator extends OperationBase {
    invert: boolean;
    inputIsArray = false;
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
        this.invert = this.config.output === false;
    }

    // this is overwritten with mixin
    method(_value: any, _context: any, _args: any) { return false; }

    run(doc: DataEntity) {
        const args = this.config;

        try {
            let isValid = this.method(doc, doc, args);

            if (this.invert) isValid = !isValid;
            if (isValid) return doc;

            return null;
        } catch (err) {
            return null;
        }
    }
}

function setup(method: string) {
    return InjectMethod(Validator, RecordValidator[method], RecordValidator.repository[method]);
}

const exclusion: string[] = [];

for (const config of Object.values(RecordValidator.repository)) {
    const fnName = config.fn.name;
    if (!exclusion.includes(fnName))RecordValidatorContainer[fnName] = setup(fnName);
}

export default RecordValidatorContainer;
