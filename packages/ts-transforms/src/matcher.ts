import { Logger, debugLogger } from '@terascope/utils';
import { PhaseManager } from './phases';
import { WatcherConfig } from './interfaces';

export default class Matcher extends PhaseManager {
    constructor(opConfig: WatcherConfig, logger: Logger = debugLogger('ts-transforms')) {
        const config = Object.assign(opConfig, { type: 'matcher' });
        // @ts-expect-error this is for backwards compatability
        if (config.types) config.type_config = config.types;
        super(config, logger);
    }
}
