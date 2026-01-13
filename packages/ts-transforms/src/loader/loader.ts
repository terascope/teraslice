import { Logger } from '@terascope/core-utils';
import RulesLoader from './rules-loader.js';
import RulesParser from './rules-parser.js';
import RulesValidator from './rules-validator.js';
import { ValidationResults, WatcherConfig } from '../interfaces.js';
import { OperationsManager } from '../index.js';

export default class Loader {
    private opConfig: WatcherConfig;
    private logger: Logger;

    constructor(opConfig: WatcherConfig, logger: Logger) {
        this.opConfig = opConfig;
        this.logger = logger;
    }

    public async load(opsManager: OperationsManager): Promise<ValidationResults> {
        const loader = new RulesLoader(this.opConfig, this.logger);
        const loadResults = await loader.load();
        const rulesParser = new RulesParser(loadResults, this.logger);
        const parsedResults = rulesParser.parse();
        const validator = new RulesValidator(parsedResults, opsManager, this.logger);
        return validator.validate();
    }
}
