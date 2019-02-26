
import RulesLoader from './rules-loader';
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
        const results = await loader.load();
        const validator = new RulesValidator(results, this.logger);
        return validator.validate();
    }
}
