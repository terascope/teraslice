
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default abstract class TransformBase extends OperationBase {

    constructor(config: OperationConfig) {
        super(config);
    }

    protected decode(doc: DataEntity, decodeFn: Function) {
        try {
            const data = _.get(doc, this.source);
            if (typeof data !== 'string') {
                _.unset(doc, this.source);
            } else {
                _.set(doc, this.target, decodeFn(data));
            }
        } catch (err) {
            _.unset(doc, this.source);
        }

        if (this.removeSource) _.unset(doc, this.source);
        return doc;
    }

    abstract run(data: DataEntity): null | DataEntity;
}
