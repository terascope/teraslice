
import _ from 'lodash';
import { parseConfig } from './utils';
import { Logger } from '@terascope/utils';
import { OperationConfig, ValidationResults } from '../interfaces';

export default class RulesValidator {
    private configList: OperationConfig[];
    private logger: Logger;

    constructor(configList: OperationConfig[], logger: Logger) {
        this.configList = configList;
        this.logger = logger;
    }

    validate(): ValidationResults {
        const results = parseConfig(this.configList, this.logger);
        if (results.selectors.length === 0) throw new Error('Invalid configuration file, no selector configurations where found');
        return results;
    }
}
