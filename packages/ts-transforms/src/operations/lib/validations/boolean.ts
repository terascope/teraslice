
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base';

export default class Boolean extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    isBoolean(field: string | number | undefined): boolean {
        if (field === undefined) return false;
        if (_.isBoolean(field)) return true;
        if (field === 'true' || field === 'false') return true;
        if (field === '1' || field === 1) return true;
        if (field === '0' || field === 0) return true;
        return false;
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (!this.isBoolean(field)) _.unset(doc, this.source);
        return doc;
    }
}
