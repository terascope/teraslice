import { Logger, debugLogger } from '@terascope/core-utils';
import { PhaseManager } from './phases/index.js';
import { WatcherConfig } from './interfaces.js';

export default class Matcher extends PhaseManager {
    constructor(opConfig: WatcherConfig, logger: Logger = debugLogger('ts-transforms')) {
        const config = Object.assign(opConfig, { type: 'matcher' });
        // @ts-expect-error this is for backwards compatability
        if (config.types) config.type_config = config.types;
        super(config, logger);
    }
}
