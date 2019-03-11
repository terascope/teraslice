
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
    // @ts-ignore
    private logger: Logger;
    public sequence: PhaseBase[];
    readonly isMatcher: boolean;

    constructor(opConfig: PhaseConfig, logger:Logger = debugLogger('ts-transforms')) {
        this.opConfig = opConfig;
        this.loader = new Loader(opConfig, logger);
        this.logger = logger;
        this.sequence = [];
        this.isMatcher = opConfig.type === 'matcher';
    }

    public async init (Plugins?: PluginList) {
        const opsManager = new OperationsManager(Plugins);
        const phaseConfiguration = await this.loader.load(opsManager);
        const sequence: PhaseBase[] = [
            new SelectionPhase(this.opConfig, phaseConfiguration.selectors, opsManager),
        ];

        if (!this.isMatcher) {
            sequence.push(
                new ExtractionPhase(this.opConfig, phaseConfiguration.extractions, opsManager),
                new PostProcessPhase(this.opConfig, phaseConfiguration.postProcessing, opsManager),
            );
        }

        sequence.push(new OutputPhase(this.opConfig, phaseConfiguration.output, opsManager));
        this.sequence = sequence;
    }

    public run(input: object[]): DataEntity[] {
        let data = input;
        if (!DataEntity.isDataEntityArray(data)) data = DataEntity.makeArray(data);
        return this.sequence.reduce<DataEntity[]>((dataArray, phase:PhaseBase) => {
            return phase.run(dataArray);
        }, data as DataEntity[]);
    }
}
