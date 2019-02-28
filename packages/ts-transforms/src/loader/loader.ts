
import RulesLoader from './rules-loader';
import RulesParser from './rules-parser';
import RulesValidator from './rules-validator';
import { Logger } from '@terascope/utils';
import { ValidationResults, WatcherConfig } from '../interfaces';

export default class Loader {
    private opConfig: WatcherConfig;
    private logger: Logger;

    constructor(opConfig: WatcherConfig, logger: Logger) {
        this.opConfig = opConfig;
        this.logger = logger;
    }

    public async load(): Promise<ValidationResults> {
        const loader = new RulesLoader(this.opConfig, this.logger);
        let loadResults;
        let parsedResults;
        let results;
        try {
            loadResults = await loader.load();
        } catch (err) {
            throw new Error(`could not load rules error: ${err.stack}`);
        }
        const rulesParser = new RulesParser(loadResults, this.logger);
        try {
            parsedResults = rulesParser.parse();
        } catch (err) {
            throw new Error(`could not parse rules error: ${err.stack}`);
        }
        const validator = new RulesValidator(parsedResults, this.logger);
        try {
            results = validator.validate();
        } catch (err) {
            throw new Error(`could not validate rules error: ${err.stack}`);
        }
        return results;
    }
}
