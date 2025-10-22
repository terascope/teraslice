import { DataEntity, get, isEmpty } from '@terascope/core-utils';
import { FieldTransform, RecordTransform } from '@terascope/data-mate';
import { InjectMethod } from '../mixins.js';
import TransformsOpBase from '../../lib/transforms/base.js';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces.js';

const FieldTransformContainer = {} as any;

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
        let value;

        if (Array.isArray(this.source)) {
            value = this.source.map((field) => get(doc, field));
        } else {
            value = get(doc, this.source);
        }

        try {
            const results = this.method(value, doc, args);
            if (isEmpty(results)) {
                this.removeSource(doc);
                if (Object.keys(doc).length === 0) return null;
            } else {
                this.set(doc, results);
            }
        } catch (err) {
            this.removeSource(doc);
            if (Object.keys(doc).length === 0) return null;
        }

        return doc;
    }
}

function setup(method: string, DateMateTransforms: any) {
    return InjectMethod(
        Transforms,
        DateMateTransforms[method],
        DateMateTransforms.repository[method]
    );
}

const exclusion = ['select', 'extract', 'setField'];

for (const config of Object.values(FieldTransform.repository)) {
    const fnName = config.fn.name;

    if (!exclusion.includes(fnName)) {
        FieldTransformContainer[fnName] = setup(fnName, FieldTransform);
    }
}

// Dedupe was migrated to Record Transforms, in a directives perspective
// it should work the same as a field or reecord level transform. However in regards
// to ts-transforms dedupe would only be working on a field in this context.

const dedupeConfig = RecordTransform.repository.dedupe;
FieldTransformContainer[dedupeConfig.fn.name] = setup(dedupeConfig.fn.name, RecordTransform);

export default FieldTransformContainer;
