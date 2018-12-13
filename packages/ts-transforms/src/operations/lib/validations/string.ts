
import OperationBase from '../base';
import { DataEntity } from '@terascope/job-components';
import { StringRefs } from '../../../interfaces'
import _ from 'lodash';

export default class String extends OperationBase {
    private length?: number;

    constructor(config: StringRefs) {
        super(config);
        this.length = config.length;
    }

    run(data: DataEntity): DataEntity | null {
        const { source, length } = this;
        if (typeof data[source] !== 'string') _.unset(data, source);
        if (length && data[source] && data[source].length !== length) _.unset(data, source);
        return data;
    }
}
