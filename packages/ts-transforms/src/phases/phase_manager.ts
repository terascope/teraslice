
import { DataEntity, Logger, debugLogger } from '@terascope/utils';
import _ from 'lodash';
import { PhaseConfig, PluginList } from '../interfaces';
import { Loader } from '../loader';
import SelectionPhase from './selector_phase';
import ExtractionPhase from './extraction_phase';
import PostProcessPhase from './post_process_phase';
import OutputPhase from './output_phase';
import { OperationsManager } from '../operations';
import PhaseBase from './base';

export default class PhaseManager {
    private opConfig: PhaseConfig;
    private loader: Loader;
    private logger: Logger;
    public sequence: PhaseBase[];
    readonly isMatcher: boolean;

    constructor(opConfig: PhaseConfig, logger:Logger = debugLogger('ts-transforms')) {
        this.opConfig = opConfig;
        this.loader = new Loader(opConfig);
        this.logger = logger;
        this.sequence = [];
        this.isMatcher = opConfig.type === 'matcher';
    }

    public async init (Plugins?: PluginList) {
        try {
            const configList = await this.loader.load();
            const opsManager = new OperationsManager(Plugins);
            const sequence: PhaseBase[] = [
                new SelectionPhase(this.opConfig, _.cloneDeep(configList), opsManager),
            ];

            if (!this.isMatcher) {
                sequence.push(
                    new ExtractionPhase(this.opConfig, _.cloneDeep(configList), opsManager),
                    new PostProcessPhase(this.opConfig, _.cloneDeep(configList), opsManager),
                );
            }

            sequence.push(new OutputPhase(this.opConfig, _.cloneDeep(configList), opsManager));

            this.sequence = sequence;
        } catch (err) {
            const errMsg = `could not instantiate phase manager: ${err.message}`;
            this.logger.error(errMsg);
            throw new Error(errMsg);
        }
    }

    public run(input: object[]): DataEntity[] {
        let data = input;
        if (!DataEntity.isDataEntityArray(data)) data = DataEntity.makeArray(data);
        return this.sequence.reduce<DataEntity[]>((dataArray, phase:PhaseBase) => {
            return phase.run(dataArray);
        }, data as DataEntity[]);
    }
}
