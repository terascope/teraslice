import fs from 'node:fs';
import path from 'node:path';
import { parseJSON, fastCloneDeep } from '@terascope/core-utils';
import { SlicerRecoveryData } from '../../interfaces/index.js';
import { TestReaderConfig } from './interfaces.js';
import defaultData from './data/slicer-data.js';
import { Slicer } from '../../operations/index.js';

export default class TestSlicer extends Slicer<TestReaderConfig> {
    requests: Record<string, any>[] = [];
    position = 0;

    async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
        await super.initialize(recoveryData);
        const filePath = this.opConfig.slicer_data_file_path;

        if (!filePath) {
            this.requests = fastCloneDeep(defaultData);
            return;
        }

        try {
            this.requests = parseJSON(fs.readFileSync(path.resolve(filePath)));
        } catch (err) {
            throw new Error(`Unable to read file at path ${filePath}`);
        }
    }

    async shutdown(): Promise<void> {
        this.requests = [];
        await super.shutdown();
    }

    async slice(): Promise<any | null> {
        if (this.executionConfig.lifecycle === 'once') {
            const request = this.requests.shift();
            if (request == null) return null;
            return request;
        }

        if (this.position + 1 >= this.requests.length) {
            this.position = 0;
        }

        return this.requests[++this.position];
    }
}
