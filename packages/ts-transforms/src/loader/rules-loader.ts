import fs from 'fs';
import readline from 'readline';
import { WatcherConfig, UnparsedConfig } from '../interfaces';
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

    public async load(): Promise<UnparsedConfig[]> {
        const results = await Promise.all<UnparsedConfig[]>(this.opConfig.rules.map((ruleFile) => this.fileLoader(ruleFile)));
        return _.flatten(results);
    }

    private parseConfig(strConfig: string): UnparsedConfig {
        if (strConfig.charAt(0) !== '{') {
            return { selector: strConfig as string };
        }
        return JSON.parse(strConfig);
    }

    private async fileLoader(ruleFile: string): Promise<UnparsedConfig[]> {
        const parseConfig = this.parseConfig.bind(this);
        const results: UnparsedConfig[] = [];
        const errorResults: UnparsedConfig[] = [];
        let hasError = false;

        const rl = readline.createInterface({
            input: fs.createReadStream(ruleFile),
            crlfDelay: Infinity
        });
        // TODO: error handling here
        return new Promise<UnparsedConfig[]>((resolve, reject) => {
            rl.on('line', (str) => {
                if (str) {
                    const configStr = str.trim();
                    const isComment = configStr[0] === '#';
                    if (!isComment) {
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
