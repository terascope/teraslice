import { DataEntity, Logger, debugLogger } from '@terascope/utils';
import { PhaseConfig, PluginList } from '../interfaces';
import { Loader } from '../loader';
import SelectionPhase from './selector-phase';
import ExtractionPhase from './extraction-phase';
import PostProcessPhase from './post-process-phase';
import OutputPhase from './output-phase';
import { OperationsManager } from '../operations';
import PhaseBase from './base';

export default class PhaseManager {
    private opConfig: PhaseConfig;
    private loader: Loader;
    public sequence: PhaseBase[];
    readonly isMatcher: boolean;

    constructor(opConfig: PhaseConfig, logger: Logger = debugLogger('ts-transforms')) {
        this.opConfig = opConfig;
        this.loader = new Loader(opConfig, logger);
        this.sequence = [];
        this.isMatcher = opConfig.type === 'matcher';
    }

    async init(plugins?: PluginList): Promise<void> {
        const opsManager = new OperationsManager(plugins);
        const {
            selectors,
            extractions,
            postProcessing,
            output
        } = await this.loader.load(opsManager);

        const sequence: PhaseBase[] = [
            new SelectionPhase(this.opConfig, selectors, opsManager)
        ];

        if (!this.isMatcher) {
            if (Object.keys(extractions).length) {
                sequence.push(
                    new ExtractionPhase(this.opConfig, extractions, opsManager)
                );
            }

            if (Object.keys(postProcessing).length) {
                sequence.push(
                    new PostProcessPhase(this.opConfig, postProcessing, opsManager)
                );
            }
        }

        sequence.push(new OutputPhase(this.opConfig, output, opsManager));
        this.sequence = sequence;
    }

    public run(input: Record<string, any>[]): DataEntity[] {
        const data = DataEntity.makeArray(input);

        return this.sequence.reduce<DataEntity[]>(
            (dataArray, phase: PhaseBase) => phase.run(dataArray),
            data as DataEntity[]
        );
    }
}
