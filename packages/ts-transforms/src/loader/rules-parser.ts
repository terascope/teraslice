
import _ from 'lodash';
import shortid from 'shortid';
import { OperationConfigInput, OperationConfig } from '../interfaces';
import { isDeprecatedCompactConfig, needsDefaultSelector } from './utils';
import { Logger } from '@terascope/utils';

export default class RulesParser {
    private configList: OperationConfigInput[];
    // @ts-ignore
    private logger: Logger;

    constructor(configList: OperationConfigInput[], logger: Logger) {
        this.configList = configList;
    }

    parse(): OperationConfig[] {
        const resultsArray: OperationConfig[] = [];
        this.configList.forEach((config) => {
            _.set(config, '__id', shortid.generate());

             // if its not set and its not a post process then set the selecter to *
            if (needsDefaultSelector(config)) config.selector = '*';

            if (config.tag) {
                config.tags = [config.tag];
                delete config.tag;
            }

            if (isDeprecatedCompactConfig(config)) {
                const errStr = `format error for config: ${JSON.stringify(config)}. Please separate post_process/validations out to their own configs and use tag/follow semantics`;
                throw new Error(errStr);
            } else {
                resultsArray.push(config as OperationConfig);
            }

        });
        return resultsArray;
    }
}
