
import _ from 'lodash';
import { parseConfig } from './utils';
import { Logger } from '@terascope/utils';
import { OperationConfig, ValidationResults } from '../interfaces';
import { OperationsManager } from '../index';

export default class RulesValidator {
    private configList: OperationConfig[];
    private logger: Logger;
    private opsManager: OperationsManager;

    constructor(configList: OperationConfig[], opsManager: OperationsManager, logger: Logger) {
        this.configList = configList;
        this.logger = logger;
        this.opsManager = opsManager;
    }

    validate(): ValidationResults {
        const results = parseConfig(this.configList, this.opsManager, this.logger);
        if (results.selectors.length === 0) throw new Error('Invalid configuration file, no selector configurations where found');
        return results;
    }
}
