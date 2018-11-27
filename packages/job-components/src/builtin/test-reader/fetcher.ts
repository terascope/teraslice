import fs from 'fs';
import path from 'path';
import { TestReaderConfig } from './interfaces';
import { Fetcher } from '../../operations';
import { parseJSON } from '../../utils';

const defaultFilePath = path.join(__dirname, 'data', 'fetcher-data.json');

export default class TestFetcher extends Fetcher<TestReaderConfig> {
    cachedData: Buffer|null = null;
    lastFilePath: string = '';

    async initialize() {
        super.initialize();
    }

    async fetch() {
        const filePath = this.opConfig.fetcherDataFilePath || defaultFilePath;
        if (this.lastFilePath !== filePath) {
            this.cachedData = null;
            this.lastFilePath = filePath;
        }

        try {
            if (this.cachedData != null) {
                return parseJSON(this.cachedData);
            }

            const data = fs.readFileSync(filePath);
            this.cachedData = data;
            return parseJSON(data);
        } catch (err) {
            throw new Error(`Unable to read file at path ${filePath}`);
        }
    }
}
