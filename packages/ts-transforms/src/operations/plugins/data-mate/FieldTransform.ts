/* eslint-disable max-classes-per-file */
import { DataEntity, get, isEmpty } from '@terascope/utils';
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
    method(value: any, _context: any, _args: any) { return value as any; }

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

function setup(method: string) {
    return InjectMethod(Transforms, FieldTransform[method], FieldTransform.repository[method]);
}

const exclusion = ['select', 'extract'];

for (const config of Object.values(FieldTransform.repository)) {
    const fnName = config.fn.name;
    if (!exclusion.includes(fnName)) FieldTransformContainer[fnName] = setup(fnName);
}

export default FieldTransformContainer;
