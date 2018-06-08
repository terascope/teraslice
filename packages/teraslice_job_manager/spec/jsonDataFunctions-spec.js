'use strict';

const fs = require('fs-extra');
const path = require('path');

describe('tests jsonDataFunctions', () => {
    it('job files do not have to end in json', () => {
        fs.writeFileSync(path.join(__dirname, '..', 'tfile.prod.json'), JSON.stringify({ test: 'test' }));
        let jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        let jobData = jobFileFunctions.jobFileHandler('tfile.prod.json');
        expect((jobData[1]).test).toBe('test');

        jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        jobData = jobFileFunctions.jobFileHandler('tfile.prod');
        expect((jobData[1]).test).toBe('test');
        fs.unlinkSync(path.join(__dirname, '..', 'tfile.prod.json'));
    });

    it('no job file throws error', () => {
        const jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        expect(jobFileFunctions.jobFileHandler).toThrow('Missing the job file!');
    });

    it('path should change to asset/jsonFile if true as second function input', () => {
        fs.emptyDirSync(path.join(__dirname, '..', 'asset'));
        fs.writeFileSync(path.join(__dirname, '..', 'asset/assetTest.json'), JSON.stringify({ test: 'test' }));
        const jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        const returnData = jobFileFunctions.jobFileHandler('assetTest.json', true);
        expect(returnData[0]).toBe(path.join(__dirname, '..', 'asset/assetTest.json'));
        expect(returnData[1].test).toBe('test');
    });

    it('bad file path throws an error', () => {
        const jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        expect(() => { jobFileFunctions.jobFileHandler('jobTest.json'); }).toThrow('Sorry, can\'t find the JSON file: jobTest.json');
    });

    it('empty json file throws an error', () => {
        fs.writeFileSync(path.join(__dirname, '..', 'testFile.json'), JSON.stringify({ }));
        const jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        expect(() => { jobFileFunctions.jobFileHandler('testFile.json'); }).toThrow('JSON file contents cannot be empty');
        fs.unlinkSync(path.join(__dirname, '..', 'testFile.json'));
    });

    it('response if metadata is not in file, but needs to be', () => {
        const jsonFileData = {
            name: 'this is a name',
            version: '0.0.1',
            tjm: {}
        };

        // test metadata for asset
        jsonFileData.tjm = {
            clusters: ['http://localhost', 'http://cluster2']
        };
        let jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        let metaDataCheckResponse = jobFileFunctions.metaDataCheck(jsonFileData);
        expect(metaDataCheckResponse).toBe(true);
        delete jsonFileData.tjm;
        // test metadata for job
        jsonFileData.tjm = {
            cluster: 'http://localhost'
        };
        metaDataCheckResponse = jobFileFunctions.metaDataCheck(jsonFileData);
        expect(metaDataCheckResponse).toBe(true);

        // test no metadata
        delete jsonFileData.tjm;
        jobFileFunctions = require('../cmds/cmd_functions/json_data_functions')();
        expect(jobFileFunctions.metaDataCheck).toThrow('No teraslice job manager metadata, register the job or deploy the assets');
    });
});
