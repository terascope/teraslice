import fs from 'node:fs';
import { EachProcessor, WorkerContext, ExecutionConfig } from '@terascope/job-components';
import { SaveFileConfig } from './interfaces';

export default class SaveFile extends EachProcessor<SaveFileConfig> {
    filePath: string;

    constructor(context: WorkerContext, opConfig: SaveFileConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);
        this.filePath = opConfig.file_path;
    }

    async forEach(record: any) {
        fs.appendFileSync(this.filePath, `${JSON.stringify(record)}\n`);
    }
}
