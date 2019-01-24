
import { debugLogger, DataEntity } from '@terascope/job-components';
import { Matcher, Transform, PhaseManager, WatcherConfig, PluginList } from '../src/index';

const logger = debugLogger('ts-transform');

export default class TestHarness {
    private phaseManager!: PhaseManager;
    private type: string;
    private dict: object;

    constructor(type: string) {
        this.type = type;
        this.dict = {
            matcher: Matcher,
            transform: Transform
        };
    }

    async init (config: WatcherConfig, plugins?: PluginList) {
        this.phaseManager = new this.dict[this.type](config, logger);
        await this.phaseManager.init(plugins);
        return this;
    }
    run(data: DataEntity[]) {
        return this.phaseManager.run(data);
    }
}
