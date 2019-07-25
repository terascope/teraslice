import fs from 'fs';
import readline from 'readline';
import { Readable } from 'stream';
import { WatcherConfig, OperationConfigInput } from '../interfaces';
import _ from 'lodash';
import { Logger, TSError } from '@terascope/utils';

export default class RulesLoader {
    private opConfig: WatcherConfig;
    // @ts-ignore
    private logger: Logger;

    constructor(opConfig: WatcherConfig, logger: Logger) {
        this.opConfig = opConfig;
        this.logger = logger;
    }

    public async load(): Promise<OperationConfigInput[]> {
        const { notification_rules, rules } = this.opConfig;

        if (notification_rules) {
            return this.dataLoader(false, this.opConfig.notification_rules);
        }

        if (rules) {
            const results = await Promise.all<OperationConfigInput[]>(rules.map((ruleFile) => this.dataLoader(ruleFile)));
            return _.flatten(results);
        }

        throw new TSError('rules or notifications must be provided');
    }

    private parseConfig(strConfig: string): OperationConfigInput {
        if (strConfig.charAt(0) !== '{') {
            return { selector: strConfig };
        }
        return JSON.parse(strConfig);
    }

    private async dataLoader(ruleFile: string|false, notifications?: string): Promise<OperationConfigInput[]> {
        const parseConfig = this.parseConfig.bind(this);
        const results: OperationConfigInput[] = [];
        const errorResults: string[] = [];
        let hasError = false;

        let inputStream;

        if (ruleFile) {
            inputStream = fs.createReadStream(ruleFile);
        } else if (notifications != null && notifications.length > 0) {
            const notificationsRules = [notifications];

            inputStream = new Readable({
                read() {
                    const rule = notificationsRules.pop();
                    if (!rule) {
                        this.push(null);
                    }
                    this.push(rule);
                },
            });
        } else {
            throw new TSError('rules or notifications must be provided');
        }

        const rl = readline.createInterface({
            input: inputStream,
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
