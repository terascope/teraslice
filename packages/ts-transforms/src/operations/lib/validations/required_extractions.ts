
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import OperationBase from '../base';

export default class RequiredExtractions extends OperationBase {
    constructor(config: object) {
        super(config);
        this.config = config;
    }
    // TODO: this should be an output functionality
    // validate() {

    // }

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
