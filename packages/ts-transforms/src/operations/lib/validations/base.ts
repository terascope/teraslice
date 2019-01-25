
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default abstract class ValidationOpBase<T> extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    abstract validate (data: T|null|undefined): boolean;

    normalize (data: any, _doc: DataEntity) {
        return data;
    }

    run(doc: DataEntity): DataEntity | null {
        let data = _.get(doc, this.source);
        let isValid = false;

        if (data === undefined) {
            this.removeSource(doc);
            return doc;
        }

        try {
            if (this.normalize) data = this.normalize(data, doc);

            isValid = this.validate(data);
            // if output is false we invert the validation
            if (this.config.output === false) isValid = !isValid;
            if (isValid) {
                this.set(doc, data);
            } else {
                this.removeSource(doc);
            }
        } catch (err) {
            this.removeSource(doc);
        }

        return doc;
    }
}
