import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { FlusherConfig } from './interfaces.js';

export default class Flusher extends BatchProcessor<FlusherConfig> {
    _flushing = false;
    _state: DataEntity[] = [];

    async onFlushStart(): Promise<void> {
        this._flushing = true;
    }

    async onFlushEnd(): Promise<void> {
        this._flushing = false;
    }

    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        if (this._flushing) return this._state;
        this._state = data;
        return [];
    }
}
