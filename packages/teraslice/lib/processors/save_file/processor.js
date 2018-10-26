'use strict';

const fs = require('fs');
const { EachProcessor } = require('@terascope/job-components');

class SaveFile extends EachProcessor {
    constructor(...args) {
        super(...args);
        this.filePath = this.opConfig.file_path;
    }

    async forEach(record) {
        fs.appendFileSync(this.filePath, `${JSON.stringify(record)}\n`);
    }
}

module.exports = SaveFile;
