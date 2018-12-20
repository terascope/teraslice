
import { DataEntity, Logger } from '@terascope/job-components';
import _ from 'lodash';
import { WatcherConfig } from '../interfaces';
import Loader from '../loader';
import SelectionPhase from './selector_phase';
import TransformPhase from './transform_phase';
import PostProcessPhase from './post_process_phase';
import ValidationPhase from './validation_phase';

import PhaseBase from './base';

export default class PhaseManager {
    private opConfig: WatcherConfig;
    private loader: Loader;
    private logger: Logger;
    private sequence: PhaseBase[];
    private isMatcher: boolean;

    constructor(opConfig: WatcherConfig, logger:Logger) {
        this.opConfig = opConfig;
        this.loader = new Loader(opConfig);
        this.logger = logger;
        this.sequence = [];
        this.isMatcher = opConfig.type === 'matcher';
    }

    public async init () {
        try {
            const configList = await this.loader.load();
            const sequence: PhaseBase[] = [
                new SelectionPhase(this.opConfig, configList),
            ];

            if (!this.isMatcher) {
                sequence.push(
                    new TransformPhase(this.opConfig, configList),
                    new PostProcessPhase(this.opConfig, configList),
                    new ValidationPhase(this.opConfig, configList)
                );
            }

            this.sequence = sequence;
        } catch (err) {
            const errMsg = `could not instantiate phase manager: ${err.message}`;
            this.logger.error(errMsg);
            throw new Error(errMsg);
        }
    }

    public run(data: DataEntity[]): DataEntity[] {
        return this.sequence.reduce<DataEntity[]>((data, phase:PhaseBase) => {
            return phase.run(data);
        }, data);
    }
}
