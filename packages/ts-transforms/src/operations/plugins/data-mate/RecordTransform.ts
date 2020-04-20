/* eslint-disable max-classes-per-file */
import { DataEntity } from '@terascope/utils';
import { RecordTransform } from '@terascope/data-mate';
import { InjectMethod } from '../mixins';
import TransformsOpBase from '../../lib/transforms/base';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces';

const RecordTransformContainer = {} as any;

class Transforms extends TransformsOpBase {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
    }

    // this is overwritten with mixin
    method(value: any, _args: any) { return value as any; }

    run(doc: DataEntity) {
        const args = this.config;
        try {
            return this.method(doc, args);
        } catch (err) {
            return null;
        }
    }
}

function setup(method: string) {
    return InjectMethod(Transforms, RecordTransform[method], RecordTransform.repository[method]);
}

for (const config of Object.values(RecordTransform.repository)) {
    const fnName = config.fn.name;
    RecordTransformContainer[fnName] = setup(fnName);
}

export default RecordTransformContainer;
