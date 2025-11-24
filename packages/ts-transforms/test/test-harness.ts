import { debugLogger } from '@terascope/core-utils';
import { DataEntity } from '@terascope/core-utils';
import {
    Matcher, Transform, PhaseManager, WatcherConfig, PluginList
} from '../src/index';

const logger = debugLogger('ts-transform');

export default class TestHarness {
    private phaseManager!: PhaseManager;
    private type: string;
    private dict: Record<string, any>;

    constructor(type: string) {
        this.type = type;
        this.dict = {
            matcher: Matcher,
            transform: Transform
        };
    }

    async init(config: WatcherConfig, plugins?: PluginList): Promise<TestHarness> {
        this.phaseManager = new this.dict[this.type](config, logger);
        await this.phaseManager.init(plugins);
        return this;
    }

    run(data: DataEntity[]): DataEntity[] {
        return this.phaseManager.run(data);
    }
}
