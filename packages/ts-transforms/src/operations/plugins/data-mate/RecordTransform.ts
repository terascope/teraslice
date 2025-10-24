import { DataEntity } from '@terascope/entity-utils';
import { RecordTransform } from '@terascope/data-mate';
import { InjectMethod } from '../mixins.js';
import TransformsOpBase from '../../lib/transforms/base.js';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces.js';

const RecordTransformContainer = {} as any;

class Transforms extends TransformsOpBase {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
    }

    // this is overwritten with mixin
    method(value: any, _context: any, _args: any) {
        return value as any;
    }

    run(doc: DataEntity) {
        const args = this.config;
        try {
            return this.method(doc, doc, args);
        } catch (err) {
            return null;
        }
    }
}

function setup(method: keyof typeof RecordTransform) {
    return InjectMethod(Transforms, RecordTransform[method], RecordTransform.repository[method]);
}

// in this context we want dedupe to work on a field level
const exclusion = ['dedupe'];

for (const config of Object.values(RecordTransform.repository)) {
    const fnName = config.fn.name;

    if (!exclusion.includes(fnName)) {
        RecordTransformContainer[fnName] = setup(fnName);
    }
}

export default RecordTransformContainer;
