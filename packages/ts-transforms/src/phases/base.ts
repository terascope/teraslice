import { DataEntity } from '@terascope/entity-utils';
import { OperationsPipline, WatcherConfig } from '../interfaces.js';

export default abstract class PhaseBase {
    readonly phase: OperationsPipline;
    public hasProcessing: boolean;
    protected opConfig: WatcherConfig;

    constructor(opConfig: WatcherConfig) {
        this.opConfig = opConfig;
        this.phase = {};
        this.hasProcessing = false;
    }

    abstract run(data: DataEntity[]): DataEntity[];
}
