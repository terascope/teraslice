import fs from 'fs';
import { EachProcessor } from '@terascope/job-components';

export default class SaveFile extends EachProcessor {
    constructor(...args) {
        super(...args);
        this.filePath = this.opConfig.file_path;
    }

    async forEach(record) {
        fs.appendFileSync(this.filePath, `${JSON.stringify(record)}\n`);
    }
}
