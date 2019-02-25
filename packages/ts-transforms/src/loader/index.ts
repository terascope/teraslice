
import fs from 'fs';
import readline from 'readline';
import { WatcherConfig, OperationConfig } from '../interfaces';
import _ from 'lodash';
import RulesValidator from './rules-validator';
import shortid from 'shortid';
// @ts-ignore
import { isSimplePostProcessConfig } from './utils';

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

class Loader {
    private opConfig: WatcherConfig;
    private multiValueCounter: number;

    constructor(opConfig: WatcherConfig) {
        this.opConfig = opConfig;
        this.multiValueCounter = 0;
    }

    public async load():Promise<OperationConfig[]> {
        const results = await Promise.all(this.opConfig.rules.map((ruleFile) => this.fileLoader(ruleFile)));
        return _.flatten(results);
    }

    private parseConfig(config: string): OperationConfig[] {
        const resultsArray: OperationConfig[] = [];
        let newConfig: null|OperationConfig = null;
        if (config.charAt(0) !== '{') {
            return [{ selector: config as string, __id: shortid.generate() }];
        }
        const results: OperationConfig =  JSON.parse(config);
        results.__id = shortid.generate();
        // if its not set and its not a post process then set the selecter to *
        if (!results.selector && !results.follow) results.selector = '*';
        // We namespace the target_field value, so we can add them back later at the end
        if (results.multivalue != null) {
            results._multi_target_field = results.target_field;
            results.target_field = `${results.target_field}${this.multiValueCounter++}`;
        }
        // we seperate simple configurations out
        if (isSimplePostProcessConfig(results)) {
            const newTag = shortid.generate();
            newConfig = migrate(results, { follow: newTag, __id: shortid.generate() });
            results.tag = newTag;
            delete results.post_process;
            delete results.post_process;
        }
        resultsArray.push(results);
        if (newConfig) resultsArray.push(newConfig);
        return resultsArray;
    }

    private async fileLoader(ruleFile: string): Promise<OperationConfig[]> {
        const parseConfig = this.parseConfig.bind(this);
        const results: OperationConfig[] = [];

        const rl = readline.createInterface({
            input: fs.createReadStream(ruleFile),
            crlfDelay: Infinity
        });
        // TODO: error handling here
        return new Promise<OperationConfig[]>((resolve) => {
            rl.on('line', (str) => {
                if (str) {
                    const configStr = str.trim();
                    const isComment = configStr[0] === '#';
                    // const config = parseConfig(configStr)
                    if (!isComment) results.push(...parseConfig(configStr));
                }
            });

            rl.on('close', () => resolve(results));
        });
    }
}

export {
    Loader,
    RulesValidator
};
