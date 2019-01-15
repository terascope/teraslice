
import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';
import validator from 'validator';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default class MacAddress extends OperationBase {
    private case: 'lowercase' | 'uppercase';
    private preserveColons: boolean;

    constructor(config: OperationConfig) {
        super(config);
        this.case = config.case || 'lowercase';
        this.preserveColons = config.preserve_colons || false;
    }

    normalizeField(value: string): string {
        let results = value;
        if (this.case === 'lowercase') results = results.toLowerCase();
        if (this.case === 'uppercase') results = results.toUpperCase();
        if (!this.preserveColons) results = results.replace(/:/gi, '');
        return results;
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);

        if (typeof field !== 'string') {
            _.unset(doc, this.source);
            return doc;
        }

        const data = this.normalizeField(field);
        const options = { no_colons: !this.preserveColons };
        // TODO: fix the types for valdiator, it does not have the options listed
        // @ts-ignore
        if (!validator.isMACAddress(data, options)) {
            _.unset(doc, this.source);
            return doc;
        }

        // we set the normalized results back in place
        _.set(doc, this.source, data);

        return doc;
    }
}
