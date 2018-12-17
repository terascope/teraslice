
import OperationBase from '../base';
import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';

export default class Keys extends OperationBase {
    private config: object;
    private minimalKeyLength: number;

    constructor(config: object) {
        super(config);
        this.config = config;
        this.minimalKeyLength = Object.keys(config).length + 1;
    }

    run(data: DataEntity): DataEntity | null {
        let hasError = false;

        _.forOwn(this.config, (_value, key) => {
            if (!_.has(data, key)) hasError = true;
        });

        if (Object.keys(data).length < this.minimalKeyLength) hasError = true;

        if (hasError) return null;
        return data;
    }
}