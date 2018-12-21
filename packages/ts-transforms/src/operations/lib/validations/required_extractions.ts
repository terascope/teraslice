
import OperationBase from '../base';
import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';

export default class RequiredExtractions extends OperationBase {
    private config: object;

    constructor(config: object) {
        super(config);
        this.config = config;
    }

    run(data: DataEntity): DataEntity | null {
        let otherExtractionsFound = false;
        let requireExtractionsFound = false;

        _.forOwn(data, (_value, key) => {
            if (_.has(this.config, key)) requireExtractionsFound = true;
            if (!_.has(this.config, key)) otherExtractionsFound = true;
        });

        if (requireExtractionsFound && !otherExtractionsFound) {
            return null;
        }

        return data;
    }
}
