import fs from 'fs';
import path from 'path';
import { parseJSON, fastCloneDeep, DataEntity } from '@terascope/utils';
import { TestReaderConfig } from './interfaces';
import { Fetcher } from '../../operations';
import { SliceRequest } from '../../interfaces';
import defaultData from './data/fetcher-data';

export default class TestFetcher extends Fetcher<TestReaderConfig> {
    cachedData: Buffer|null = null;
    lastFilePath = '';

    async initialize(): Promise<void> {
        super.initialize();
    }

    async fetch(slice?: SliceRequest[]): Promise<DataEntity[]> {
        if (this.opConfig.passthrough_slice) {
            if (!Array.isArray(slice)) {
                throw new Error('Test, when passthrough_slice is set to true it expects an array');
            }
            return slice as any[];
        }

        const filePath = this.opConfig.fetcher_data_file_path;
        if (!filePath) {
            return fastCloneDeep(defaultData) as any[];
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
