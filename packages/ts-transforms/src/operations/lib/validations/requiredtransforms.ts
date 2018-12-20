
import OperationBase from '../base';
import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';

export default class RequiredTransforms extends OperationBase {
    private config: object;

    constructor(config: object) {
        super(config);
        this.config = config;
    }

    run(data: DataEntity): DataEntity | null {
        let otherTransformFound = false;
        let requireTransformFound = false;

        _.forOwn(data, (_value, key) => {
            if (_.has(this.config, key)) requireTransformFound = true;
            if (!_.has(this.config, key)) otherTransformFound = true;
        });

        if (requireTransformFound && !otherTransformFound) {
            return null;
        }

        return data;
    }
}
