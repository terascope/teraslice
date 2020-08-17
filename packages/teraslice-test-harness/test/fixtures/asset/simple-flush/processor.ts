import {
    BatchProcessor, DataWindow
} from '@terascope/job-components';
import { FlusherConfig } from './interfaces';

export default class Flusher extends BatchProcessor<FlusherConfig> {
    _flushing = false;
    _state: DataWindow = DataWindow.make([]);

    async onFlushStart(): Promise<void> {
        this._flushing = true;
    }

    async onFlushEnd(): Promise<void> {
        this._flushing = false;
    }

    async onBatch(data: DataWindow): Promise<DataWindow> {
        if (this._flushing) return this._state;
        this._state = data;
        return DataWindow.make([]);
    }
}
