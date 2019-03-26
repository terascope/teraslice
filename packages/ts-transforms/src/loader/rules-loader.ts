import fs from 'fs';
import readline from 'readline';
import { WatcherConfig, OperationConfigInput } from '../interfaces';
import _ from 'lodash';
import { Logger } from '@terascope/utils';

export default class RulesLoader {
    private opConfig: WatcherConfig;
    // @ts-ignore
    private logger: Logger;

    constructor(opConfig: WatcherConfig, logger: Logger) {
        this.opConfig = opConfig;
        this.logger = logger;
    }

    public async load(): Promise<OperationConfigInput[]> {
        const results = await Promise.all<OperationConfigInput[]>(this.opConfig.rules.map((ruleFile) => this.fileLoader(ruleFile)));
        return _.flatten(results);
    }

    private parseConfig(strConfig: string): OperationConfigInput {
        if (strConfig.charAt(0) !== '{') {
            return { selector: strConfig };
        }
        return JSON.parse(strConfig);
    }

    private async fileLoader(ruleFile: string): Promise<OperationConfigInput[]> {
        const parseConfig = this.parseConfig.bind(this);
        const results: OperationConfigInput[] = [];
        const errorResults: string[] = [];
        let hasError = false;

        const rl = readline.createInterface({
            input: fs.createReadStream(ruleFile),
            crlfDelay: Infinity
        });

        return new Promise<OperationConfigInput[]>((resolve, reject) => {
            rl.on('line', (str) => {
                if (str) {
                    const configStr = str.trim();
                    const isComment = configStr[0] === '#';
                    if (!isComment && configStr.length > 0) {
                        try {
                            results.push(parseConfig(configStr));
                        } catch (err) {
                            hasError = true;
                            errorResults.push(configStr);
                        }
                    }
                }
            });

            rl.on('close', () => {
                if (hasError) {
                    reject(new Error(`could not load and parse the following configs: ${errorResults.join(' ')}`));
                    return;
                }
                resolve(results);
            });
        });
    }
}
