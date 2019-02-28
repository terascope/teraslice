
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import { OperationsPipline, WatcherConfig } from '../interfaces';

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
