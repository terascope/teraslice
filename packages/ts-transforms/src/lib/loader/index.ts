
import fs from 'fs';
import readline from 'readline';
import { WatcherConfig, OperationConfig } from '../interfaces';

//TODO: need story around how to load from other assets
export default class Loader {
    private opConfig: WatcherConfig;

    constructor(opConfig: WatcherConfig) {
        this.opConfig = opConfig;
    }

    public async load():Promise<OperationConfig[]> {
        return this.fileLoader();
    }

    // private async esLoader() {
    //     //TODO: implement me
    // }

    private parseConfig(config: string): OperationConfig {
        if (config.charAt(0) !== '{') {
            return { selector: config as string };
        }
        const results =  JSON.parse(config);
        // if its not set and its not a post process then set the selecter to *
        if (!results.selector && !results.refs) results.selector = '*';
        return results;
    }

    private async fileLoader(): Promise<OperationConfig[]> {
        let { parseConfig } = this;

        parseConfig = parseConfig.bind(this);
        const results: OperationConfig[] = [];
        
        const rl = readline.createInterface({
            input: fs.createReadStream(this.opConfig.file_path as string),
            crlfDelay: Infinity
          });
        //TODO: error handling here
          return new Promise<OperationConfig[]>((resolve) => {
            rl.on('line', (str) => {
                if (str) {
                    const isComment = str[0] === '#';
                    if (!isComment) results.push(parseConfig(str))
                }
            });
              
            rl.on('close', () => resolve(results));
          });
    }
}