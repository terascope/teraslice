
import { DataEntity, Logger} from '@terascope/job-components';
import _ from 'lodash';
import { WatcherConfig } from '../interfaces';
import Loader from '../loader';
import SelectionPhase from './selector_phase';
import TransformPhase from './transform_phase';
import PostProcessPhase from './post_process_phase';
import PhaseBase from './base';

export default class PhaseManager {
    private opConfig: WatcherConfig;
    private loader: Loader;
    private logger: Logger;
    private sequence: PhaseBase[];

    constructor(opConfig: WatcherConfig, logger:Logger) {
        this.opConfig = opConfig;
        this.loader = new Loader(opConfig)
        this.logger = logger;
        this.sequence = [];
    }

    public async init () {
        const { opConfig } = this;
        try {
            const configList = await this.loader.load();
            this.sequence = [
                new SelectionPhase(opConfig, configList),
                new TransformPhase(opConfig, configList),
                new PostProcessPhase(opConfig, configList)
            ];
        } 
        catch(err) {
            const errMsg = `could not instantiate phase manager: ${err.message}`;
            this.logger.error(errMsg);
            throw new Error(errMsg)
        }
    }

    public run(data: DataEntity[]): DataEntity[] {
        const { sequence }  = this;
        return sequence.reduce<DataEntity[]>((data, phase:PhaseBase) => {
            return phase.run(data) 
        }, data)
    }
}
