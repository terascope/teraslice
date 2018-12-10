
import OperationBase from '../base';
import { DataEntity } from '@terascope/job-components';
import { StringRefs } from '../../../interfaces'
import _ from 'lodash';

export default class Geolocation extends OperationBase {
    private field: string
    private length?: number;

    constructor(config: StringRefs) {
        super();
        this.field = config.target_field as string;
        this.length = config.length;
    }

    run(data: DataEntity | null): DataEntity | null {
        if (!data) return data;
        const { field, length } = this;
        if (typeof data[field] !== 'string') _.unset(data, field);
        if (length && data[field] && data[field].length !== length) _.unset(data, field);
        return data;
    }
}
