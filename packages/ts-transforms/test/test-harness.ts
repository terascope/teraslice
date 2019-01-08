
import { PhaseManager } from '../dist';
import { debugLogger, DataEntity } from '@terascope/job-components';
import { WatcherConfig, PluginList } from '../src/interfaces';

const logger = debugLogger('ts-transform');

export default class TestHarness {
    private phaseManager!: PhaseManager;

    async init (config: WatcherConfig, plugins?: PluginList) {
        this.phaseManager = new PhaseManager(config, logger);
        await this.phaseManager.init(plugins);
        return this;
    }
    run(data: DataEntity[]) {
        return this.phaseManager.run(data);
    }
}
