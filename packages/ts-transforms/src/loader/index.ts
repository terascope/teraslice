
import fs from 'fs';
import readline from 'readline';
import { WatcherConfig, OperationConfig } from '../interfaces';
import _ from 'lodash';

export default class Loader {
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

    private parseConfig(config: string): OperationConfig {
        if (config.charAt(0) !== '{') {
            return { selector: config as string };
        }
        const results =  JSON.parse(config);
        // if its not set and its not a post process then set the selecter to *
        if (!results.selector && !results.follow && !results.other_match_required) results.selector = '*';
        // We namespace the target_field value, so we can add them back later at the end
        if (results.multivalue != null) {
            results._multi_target_field = results.target_field;
            results.target_field = `${results.target_field}${this.multiValueCounter++}`;
        }
        return results;
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
                    const isComment = str[0] === '#';
                    if (!isComment) results.push(parseConfig(str));
                }
            });

            rl.on('close', () => resolve(results));
        });
    }
}
