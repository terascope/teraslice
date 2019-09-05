
import shortid from 'shortid';
import { Logger, set } from '@terascope/utils';
import { OperationConfigInput, OperationConfig } from '../interfaces';
import { isDeprecatedCompactConfig, needsDefaultSelector, hasExtractions } from './utils';

export default class RulesParser {
    private configList: OperationConfigInput[];

    constructor(configList: OperationConfigInput[], _logger?: Logger) {
        this.configList = configList;
    }

    parse(): OperationConfig[] {
        const resultsArray: OperationConfig[] = [];
        this.configList.forEach((config) => {
            set(config, '__id', shortid.generate());

            // if its not set and its not a post process then set the selecter to *
            if (needsDefaultSelector(config)) config.selector = '*';

            if (config.tag) {
                config.tags = [config.tag];
                delete config.tag;
            }
            // we default to extraction if no post process is set
            if (config.follow && hasExtractions(config) && config.post_process === undefined) {
                config.post_process = 'extraction';
            }

            if (isDeprecatedCompactConfig(config)) {
                const errStr = [
                    'format error for config: ',
                    JSON.stringify(config),
                    '. Please separate post_process/validations out to their own configs and use tag/follow semantics`',
                ].join('');
                throw new Error(errStr);
            } else {
                resultsArray.push(config as OperationConfig);
            }
        });
        return resultsArray;
    }
}
