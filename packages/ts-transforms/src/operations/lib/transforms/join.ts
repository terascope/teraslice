import { set, get, flattenDeep } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { PostProcessConfig, InputOutputCardinality } from '../../../interfaces.js';
import TransformOpBase from './base.js';

export default class Join extends TransformOpBase {
    private delimiter: string;
    private fields: string[];

    static cardinality: InputOutputCardinality = 'many-to-one';

    constructor(config: PostProcessConfig) {
        super(config);
        this.delimiter = config.delimiter !== undefined ? config.delimiter : '';
        const fields = config.fields || config.sources;
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            throw new Error(`Join configuration is misconfigured, could not determine fields to join ${JSON.stringify(config)}`);
        }
        this.fields = fields;
    }

    // source work differently here so we do not use the inherited validate
    protected validateConfig(config: PostProcessConfig): void {
        const { target: tField } = config;
        const fields = config.fields || config.sources;
        if (!tField || typeof tField !== 'string' || tField.length === 0) {
            const { name } = this.constructor;
            throw new Error(
                `could not find target for ${name} validation or it is improperly formatted, config: ${JSON.stringify(config)}`
            );
        }
        if (!fields || !Array.isArray(fields) || fields.length <= 1) {
            throw new Error(`Join configuration is misconfigured, could not determine fields to join ${JSON.stringify(config)}`);
        }
        if (config.delimiter && typeof config.delimiter !== 'string') throw new Error('paramter delimiter must be a string if defined');
        this.target = tField;
    }

    run(doc: DataEntity): DataEntity {
        const fieldsData = flattenDeep(this.fields.map((field) => get(doc, field)));
        const results = fieldsData.join(this.delimiter);
        if (results.length !== this.delimiter.length) set(doc, this.target, results);
        return doc;
    }
}
