/* eslint-disable max-classes-per-file */

import { DataEntity, get } from '@terascope/utils';
import { FieldValidator } from '@terascope/data-mate';
import { InjectMethod, OverrideConfig } from '../mixins';
import OperationBase from '../../lib/base';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces';

const FieldValidatorContainer = {} as any;

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
        let value;

        if (Array.isArray(this.source)) {
            value = this.source.map((field) => get(doc, field));
        } else {
            value = get(doc, this.source);
        }

        const args = this.config;

        try {
            if (Array.isArray(value) && !this.inputIsArray) {
                const results = value.filter((item) => {
                    if (this.invert) return !this.method(item, item, args);
                    return this.method(item, item, args);
                });
                if (results.length === 0) {
                    this.removeSource(doc);
                    if (Object.keys(doc).length === 0) return null;
                } else {
                    this.set(doc, results);
                }
            } else {
                let isValid = this.method(value, doc, args);
                if (this.invert) isValid = !isValid;

                if (isValid) {
                    this.set(doc, value);
                } else {
                    this.removeSource(doc);
                    if (Object.keys(doc).length === 0) return null;
                }
            }
        } catch (err) {
            this.removeSource(doc);
            if (Object.keys(doc).length === 0) return null;
        }

        return doc;
    }
}

function setup(method: string) {
    return InjectMethod(Validator, FieldValidator[method], FieldValidator.repository[method]);
}

// @ts-ignore
const exclusion: string[] = ['contains', 'equals'];

for (const config of Object.values(FieldValidator.repository)) {
    const fnName = config.fn.name;
    FieldValidatorContainer[fnName] = setup(fnName);
}

export default FieldValidatorContainer;
