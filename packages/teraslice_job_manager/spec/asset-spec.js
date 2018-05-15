'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

let deploy;
const _tjmFunctions = {
    loadAsset: () => {
        return deploy;
    },
    zipAsset: () => {
        return Promise.resolve(
            {
                bytes: 1000,
                success: 'very successful'
            }
        );
    }
}

let error = new Error();

describe('asset command testing', () => {
    let argv = {};

    it('deploy triggers load asset', () => {
        argv.c = 'localhost:5678';
        argv.cmd = 'deploy'; 
        deploy = Promise.resolve('deployed');  
 
        Promise.resolve()
            .then(() => require('../cmds/asset').handler(argv, _tjmFunctions))
            .then((result) => {
                expect(result).toEqual('deployed');
            })
            .catch(fail);
    })

    it('deploy should respond to a request error', () => {
        argv.c = 'localhost:5678';
        argv.cmd = 'deploy';
        error.name = 'RequestError';
        error.message = 'This is an error'
        
        deploy = Promise.reject(
            error
        );   
        return Promise.resolve()
            .then(() => require('../cmds/asset').handler(argv, _tjmFunctions))
            .catch(err => {
                expect(err).toBe(chalk.red('Could not connect to localhost:5678'));
            });
    })

    it('asset update should throw an error if no cluster data', () => {
        argv = {};
        argv.cmd = 'update';

        return Promise.resolve()
            .then(() => require('../cmds/asset').handler(argv, _tjmFunctions))
            .catch(err => expect(err).toBe(chalk.red('Cluster data is missing from asset.json or not specified using -c.')));
    })

    it('asset should deploy to cluster if -c specified', () => {

    })

});