import fs from 'fs';
import readline from 'readline';
import { WatcherConfig, OperationConfig } from '../interfaces';
import _ from 'lodash';
import shortid from 'shortid';
import { Logger } from '@terascope/utils';
import { isSimpleTagPostProcessConfig } from './utils';

export default class RulesLoader {
    private opConfig: WatcherConfig;
    private multiValueCounter: number;
    // @ts-ignore
    private logger: Logger;

    constructor(opConfig: WatcherConfig, logger: Logger) {
        this.opConfig = opConfig;
        this.multiValueCounter = 0;
        this.logger = logger;
    }

    public async load(): Promise<OperationConfig[]> {
        const results = await Promise.all<OperationConfig[]>(this.opConfig.rules.map((ruleFile) => this.fileLoader(ruleFile)));
        return _.flatten(results);
    }

    private parseConfig(strConfig: string): OperationConfig[] {
        const resultsArray: OperationConfig[] = [];
        let newConfig: null|OperationConfig = null;
        if (strConfig.charAt(0) !== '{') {
            return [{ selector: strConfig as string, __id: shortid.generate() }];
        }
        const config =  JSON.parse(strConfig);
        config.__id = shortid.generate();
        // if its not set and its not a post process then set the selecter to *
        if (!config.selector && !config.follow) config.selector = '*';
        // We namespace the target_field value, so we can add them back later at the end
        if (config.multivalue != null) {
            config._multi_target_field = config.target_field;
            config.target_field = `${config.target_field}${this.multiValueCounter++}`;
        }

        if (config.tag) {
            config.tags = [config.tag];
            delete config.tag;
        }

        // we seperate simple configurations out
        if (isSimpleTagPostProcessConfig(config)) {
            const newTag = shortid.generate();
            newConfig = migrate(config, { follow: newTag, __id: shortid.generate() });
            config.tags = [newTag];
            delete config.post_process;
            delete config.post_process;
        }
        resultsArray.push(config);
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
                    if (!isComment) results.push(...parseConfig(configStr));
                }
            });

            rl.on('close', () => resolve(results));
        });
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
