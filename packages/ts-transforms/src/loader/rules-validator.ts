
import _ from 'lodash';
import { parseConfig } from './utils';
import { OperationConfig, ValidationResults } from '../interfaces';

export default class RulesValidator {
    private configList: OperationConfig[];

    constructor(configList: OperationConfig[]) {
        this.configList = _.clone(configList);
    }

    validate(): ValidationResults {
        const results = parseConfig(this.configList);
        if (results.selectors.length === 0) throw new Error('Invalid configuration file, no selector configurations where found');
        return results;
    }
}
