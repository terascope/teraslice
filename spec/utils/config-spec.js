'use strict';
var config = require('../../lib/utils/config');
var fs = require('fs');

describe('config', function() {

    var path = process.cwd() + '/testing_for_teraslice/readers';
    var subPath = path + '/subdir';

    beforeAll(function() {
        var data1 = JSON.stringify(module.exports = [{first: 'data', more: {data: 'in here'}}]);
        var data2 = JSON.stringify([{second: 'data', more: {data: 'in here'}}]);
        var data3 = JSON.stringify([{third: 'data', more: {data: 'in here'}}]);


        try {
            fs.mkdirSync(path);
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

        try {
            fs.mkdirSync(subPath);
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

        fs.writeFileSync(path + '/elasticsearch_reader.js', 'module.exports =' + data1);
        fs.writeFileSync(path + '/file2.js', data2);
        fs.writeFileSync(subPath + '/file3.js', data3);

    });

    afterAll(function() {
        fs.unlinkSync(path + '/elasticsearch_reader.js');
        fs.unlinkSync(path + '/file2.js');
        fs.unlinkSync(path + '/subdir/file3.js');
        fs.rmdirSync(path + '/subdir');
        fs.rmdirSync(path);
        fs.rmdirSync(process.cwd() + '/testing_for_teraslice');

    });

    it('getJob will return the job.json', function() {
        /*var job = require(process.cwd() + '/example_job.json');
        var results = config.getJob();

        expect(results).toEqual(job)*/

    });

    it('isString will throw error if not given a string', function() {

        expect(function() {
            config.isString('iAmASting')
        }).not.toThrowError();
        expect(function() {
            config.isString(45)
        }).toThrowError();
        expect(function() {
            config.isString(['a string'])
        }).toThrowError();

    });

    it('getPath will try to get code at ops_directery first before checking own directory', function() {
        var jobConfig = {_op: 'elasticsearch_reader'};
        var path = process.cwd() + '/testing_for_teraslice';
        var results1 = config.getPath('readers', jobConfig._op, path);
        var results2 = config.getPath('readers', jobConfig._op, '');

        expect(results1).toEqual([{first: 'data', more: {data: 'in here'}}]);
        expect(results2.newReader).toBeDefined();
        expect(results2.schema).toBeDefined();

    });

    it('hasSchema check to see if a module is formated correctly', function() {
        var obj1 = {
            schema: function() {
                return {}
            }
        };
        var obj2 = {
            schema: function() {
                return 23
            }
        };
        var obj2 = {
            someKey: function() {
                return {}
            }
        };

        expect(function() {
            config.hasSchema(obj1, 'testing_for_teraslice')
        }).not.toThrowError();
        expect(function() {
            config.hasSchema(obj2, 'testing_for_teraslice')
        }).toThrowError();
        expect(function() {
            config.hasSchema(obj2, 'testing_for_teraslice')
        }).toThrowError();

    });

    it('lifecycle will return the correct function for exiting the system', function() {

        expect((config.lifecycle({lifecycle: 'once'})).toString()).toEqual(config.once.toString());
        expect((config.lifecycle({lifecycle: 'periodic'})).toString()).toEqual(config.periodic.toString());
        expect((config.lifecycle({lifecycle: 'persistent'})).toString()).toEqual(config.persistent.toString());

    });

    it('initializeJob returns defaults and functions to start the job', function() {
       /* var context = {
            sysconfig: {},
            cluster: {isMaster: true},
            startWorkers: function() {
            },
            makeLogger: function() {
            },
            elasticsearch: {default: {}}
        };
        var allConfig = config.initializeJob(context);

        expect(allConfig.reader).toBeDefined();
        expect(allConfig.sender).toBeDefined();
        expect(allConfig.queue).toBeDefined();
        expect(allConfig.jobConfig).toBeDefined();*/

    });

    it('validateOperation will validate convict schema\'s', function() {
       /* var opSchema = {
            port: {default: 8000}, format: function(val) {
                return typeof val === 'number'
            }
        };
        var job = {_op: "someOP", port: 1234};
        var badJob = {some: 'key'};

        var results = config.validateOperation(opSchema, job, true);

        expect(results).toEqual({port: 1234, _op: 'someOP'});
        expect(function(){config.validateOperation(opSchema, badJob, true)}).toThrowError()*/

    });
});

