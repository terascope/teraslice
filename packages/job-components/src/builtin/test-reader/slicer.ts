import fs from 'fs';
import path from 'path';
import { parseJSON } from '@terascope/utils';
import { TestReaderConfig } from './interfaces';
import { Slicer } from '../../operations';
import { dataClone } from './utils';
import defaultData from './data/slicer-data';

export default class TestSlicer extends Slicer<TestReaderConfig> {
    requests: object[] = [];
    position: number = 0;

    async initialize(recoveryData: object[]) {
        await super.initialize(recoveryData);
        const filePath = this.opConfig.slicer_data_file_path;

        if (!filePath) {
            this.requests = dataClone(defaultData);
            return;
        }

        try {
            this.requests = parseJSON(fs.readFileSync(path.resolve(filePath)));
        } catch (err) {
            throw new Error(`Unable to read file at path ${filePath}`);
        }
    }

    async shutdown() {
        this.requests = [];
        await super.shutdown();
    }

    async slice() {
        if (this.executionConfig.lifecycle === 'once') {
            const request = this.requests.shift();
            if (request == null) return null;
            return request;
        }

        if ((this.position + 1) > this.requests.length) {
            this.position = 0;
        }

        return this.requests[this.position++];
    }
}
