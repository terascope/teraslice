
import _ from 'lodash';
import shortid from 'shortid';
import { UnParsedConfig, OperationConfig } from '../interfaces';
import { isOldCompatabilityPostProcessConfig, needsDefaultSelector } from './utils';
import { Logger } from '@terascope/utils';

export default class RulesParser {
    private configList: UnParsedConfig[];
    private multiValueCounter: number;
    // @ts-ignore
    private logger: Logger;

    constructor(configList: UnParsedConfig[], logger: Logger) {
        this.configList = configList;
        this.multiValueCounter = 0;
    }

    parse(): OperationConfig[] {
        const resultsArray: OperationConfig[] = [];
        this.configList.forEach((config) => {
            let newConfig: null|OperationConfig = null;
            _.set(config, '__id', shortid.generate());

             // if its not set and its not a post process then set the selecter to *
            if (needsDefaultSelector(config)) config.selector = '*';
            // We namespace the target_field value, so we can add them back later at the end
            if (config.multivalue != null) {
                config._multi_target_field = config.target_field;
                config.target_field = `${config.target_field}${this.multiValueCounter++}`;
            }

            if (config.tag) {
                // @ts-ignore
                config.tags = [config.tag];
                delete config.tag;
            }

            // we seperate simple configurations out
            if (isOldCompatabilityPostProcessConfig(config)) {
                const newTag = shortid.generate();
                newConfig = migrate(config, { follow: newTag, __id: shortid.generate() });
                // @ts-ignore
                config.tags = [newTag];
                delete config.post_process;
                delete config.validation;
                // this area below targets the multi input old configs
                if (newConfig.selector && newConfig.post_process !== 'selector') {
                    newConfig.__pipeline = newConfig.selector;
                    delete newConfig.selector;
                    // need to migrate this over in this case
                    if (config.target_field) {
                        newConfig.target_field = config.target_field;
                        delete config.target_field;
                    }
                }
                // we push in both
                resultsArray.push(config as OperationConfig);
                resultsArray.push(newConfig);

            } else {
                resultsArray.push(config as OperationConfig);
            }

        });
        return resultsArray;
    }
}

function migrate(src:object, dest:OperationConfig): OperationConfig {
    const isDenied = {
        ouput: true,
        target_field: true,
        source_field: true,
        selector: true,
        multivalue: true,
        other_match_required: true,
        _multi_target_field: true,
        mutate: true,
        regex: true,
        start: true,
        end: true,
        __id: true
    };
    _.forOwn(src, (value, key) => {
        if (!isDenied[key]) {
            dest[key] = value;
        }
    });

    return dest;
}
