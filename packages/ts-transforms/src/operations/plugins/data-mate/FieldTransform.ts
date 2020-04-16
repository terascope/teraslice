/* eslint-disable max-classes-per-file */

import { FieldTransform } from '@terascope/data-mate';
import { InjectMethod } from '../mixins';
import TransformsOpBase from '../../lib/transforms/base';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces';

const FieldTransformContainer = {} as any;

class Transforms extends TransformsOpBase {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
    }

    // this is overwritten with mixin
    method(value: any, _args: any) { return value as any; }

    run(value: any) {
        const args = this.config;
        return this.method(value, args);
    }
}

function setup(method: string) {
    return InjectMethod(Transforms, FieldTransform, method);
}

const exclusion = ['select', 'extract', 'join'];

for (const config of Object.values(FieldTransform.repository)) {
    const fnName = config.fn.name;
    if (!exclusion.includes(fnName)) FieldTransformContainer[fnName] = setup(fnName);
}

export default FieldTransformContainer;
