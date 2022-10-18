import { Logger, debugLogger } from '@terascope/utils';
import { PhaseManager } from './phases.js';
import { WatcherConfig } from './interfaces.js';

export default class Transform extends PhaseManager {
    constructor(opConfig: WatcherConfig, logger: Logger = debugLogger('ts-transforms')) {
        const config = Object.assign(opConfig, { type: 'transform' });
        // @ts-expect-error this is for backwards compatability
        if (config.types) config.type_config = config.types;
        super(config, logger);
    }
}
