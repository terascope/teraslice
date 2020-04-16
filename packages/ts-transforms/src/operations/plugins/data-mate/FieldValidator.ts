/* eslint-disable max-classes-per-file */

import { DataEntity, get } from '@terascope/utils';
import { FieldValidator, InputType } from '@terascope/data-mate';
import { InjectMethod } from '../mixins';
import OperationBase from '../../lib/base';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces';

const FieldValidatorContainer = {} as any;

class Validator extends OperationBase {
    invert: boolean;
    _method_config!: InputType;
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
        this.invert = this.config.output === false;
    }

    // this is overwritten with mixin
    method(_value: any, _args: any) { return false; }

    run(doc: DataEntity) {
        let value;

        if (Array.isArray(this.source)) {
            value = this.source.map((field) => get(doc, field));
        } else {
            value = get(doc, this.source);
        }

        const args = this.config;
        console.log('value', value, args)
        try {
            if (Array.isArray(value) && this._method_config) {
                const results = value.filter((item) => {
                    if (this.invert) return !this.method(item, args);
                    return this.method(item, args);
                });
                if (results.length === 0) {
                    this.removeSource(doc);
                } else {
                    this.set(doc, results);
                }
            } else {
                let isValid = this.method(value, args);
                if (this.invert) isValid = !isValid;

                if (isValid) {
                    this.set(doc, value);
                } else {
                    this.removeSource(doc);
                }
            }
        } catch (err) {
            this.removeSource(doc);
        }

        return doc;
    }
}

function setup(method: string) {
    return InjectMethod(Validator, FieldValidator, method);
}

// const exclusion = ['contains'];
const exclusion: string[] = [];

for (const config of Object.values(FieldValidator.repository)) {
    const fnName = config.fn.name;
    if (!exclusion.includes(fnName))FieldValidatorContainer[fnName] = setup(fnName);
}

export default FieldValidatorContainer;
