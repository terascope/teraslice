
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
        const loadResults = await loader.load();
        const rulesParser = new RulesParser(loadResults, this.logger);
        const parsedResults = rulesParser.parse();
        const validator = new RulesValidator(parsedResults, this.logger);
        return validator.validate();
    }
}
