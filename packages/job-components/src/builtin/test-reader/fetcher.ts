import fs from 'fs';
import path from 'path';
import { parseJSON } from '@terascope/utils';
import { TestReaderConfig } from './interfaces';
import { Fetcher } from '../../operations';
import { SliceRequest } from '../../interfaces';
import { dataClone } from './utils';
import defaultData from './data/fetcher-data';

export default class TestFetcher extends Fetcher<TestReaderConfig> {
    cachedData: Buffer|null = null;
    lastFilePath: string = '';

    async initialize() {
        super.initialize();
    }

    async fetch(slice?: SliceRequest[]) {
        if (this.opConfig.passthrough_slice) {
            if (!Array.isArray(slice)) {
                throw new Error('Test, when passthrough_slice is set to true it expects an array');
            }
            return slice;
        }

        const filePath = this.opConfig.fetcher_data_file_path;
        if (!filePath) {
            return dataClone(defaultData);
        }

        if (this.lastFilePath !== filePath) {
            this.cachedData = null;
            this.lastFilePath = filePath;
        }

        try {
            if (this.cachedData != null) {
                return parseJSON(this.cachedData);
            }

            const data = fs.readFileSync(path.resolve(filePath));
            this.cachedData = data;
            return parseJSON(data);
        } catch (err) {
            throw new Error(`Unable to read file at path ${filePath}`);
        }
    }
}
