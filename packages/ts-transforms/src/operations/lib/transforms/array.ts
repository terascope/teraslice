
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces';
import TransformOpBase from './base';

export default class MakeArray extends TransformOpBase {
    private fields!: string[];

    static cardinality: InputOutputCardinality = 'many-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
    }
    // source work differently here so we do not use the inherited validate
    // @ts-ignore
    protected validateConfig(config: PostProcessConfig) {
        const { target_field: tField } = config;
        const fields = config.fields || config.source_fields;
        if (!tField || typeof tField !== 'string' || tField.length === 0)  {
            throw new Error(`could not find target_field for ${this.constructor.name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`);
        }
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            throw new Error(`array creation configuration is misconfigured, could not determine fields to join ${JSON.stringify(config)}`);
        }
        this.fields = fields;
        this.target = tField;
    }

    run(doc: DataEntity): DataEntity | null {
        const results: any[] = [];
        this.fields.forEach(field => {
            const data = _.get(doc, field);
            if (data !== undefined) {
                if (Array.isArray(data)) {
                    results.push(...data);
                } else {
                    results.push(data);
                }
            }
        });
        if (results.length > 0) _.set(doc, this.target, results);
        return doc;
    }
}
