'use strict';

// removes tjm data from json file
const fs = require('fs-extra')

exports.command = 'reset [jobFile]';
exports.desc = 'Removes tjm data from job or asset file';
exports.builder = (yargs) => {
    yargs.example('tjm reset jobfile.prod');
};
exports.handler = (argv, _testFunctions) => {
    let reply = require('./cmd_functions/reply')();
    const jsonData = require('./cmd_functions/json_data_functions')();
    const jobData = jsonData.jobFileHandler(argv.jobFile);
    const jobContents = jobData[1];
    const jobFilePath = jobData[0];

    if (_testFunctions) {
        reply = _testFunctions;
    }
    
    delete jobContents.tjm;
    return fs.writeFile(jobFilePath, JSON.stringify(jobContents, null, 4))
        .then(() => reply.success(`TJM data was removed from ${argv.jobFile}`))
        .catch((err) => reply.error(err.message));
};