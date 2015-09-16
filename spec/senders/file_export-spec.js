'use strict';

var file_sender = require('../../lib/senders/file_export');
var fs = require('fs');
var pathModule = require('path');
var Promise = require('bluebird');


describe('file_export', function() {

    var path = process.cwd() + '/testing_for_teraslice';

    beforeAll(function() {
        var data1 = JSON.stringify([{first: 'data', more: {data: 'in here'}}]);
        var data2 = JSON.stringify([{second: 'data', more: {data: 'in here'}}]);
        var data3 = JSON.stringify([{third: 'data', more: {data: 'in here'}}]);

        try {
            fs.mkdirSync(path);
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

    });

    afterAll(function() {

        function deleteDir(rootDir) {
            fs.readdirSync(rootDir).forEach(function(filename) {
                var filePath = pathModule.join(rootDir, filename);
                if (fs.statSync(filePath).isDirectory()) {
                    deleteDir(filePath);
                    fs.rmdirSync(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            });
        }

        deleteDir(path);

    });

    it('has a newSender and schema function', function() {

        expect(file_sender.schema).toBeDefined();
        expect(file_sender.newSender).toBeDefined();
        expect(typeof file_sender.schema).toEqual('function');
        expect(typeof file_sender.newSender).toEqual('function');

    });

    it('schema returns a function and has a path and elastic_metadata keys', function() {
        var results = file_sender.schema();

        expect({}.toString.call(results)).toEqual('[object Object]');
        expect(results.path).toBeDefined();
        expect(results.elastic_metadata).toBeDefined();

    });

    it('processData reads and returns correctly formated data', function() {
        var opAllElasticData = {elastic_metadata: true};
        var opElasticData = {elastic_metadata: false};
        var op = {};
        var data = [{im: 'someData'}, {im: 'evenMoreData'}];
        var elasticData = {hits: {hits: [{some: 'metadata', _source: {some: 'data', more: 'data'}}]}};

        var result1 = file_sender.processData(data, op);
        var result2 = file_sender.processData(elasticData, opAllElasticData);
        var result3 = file_sender.processData(elasticData, opElasticData);

        expect(result1).toEqual('[{"im":"someData"},{"im":"evenMoreData"}]');
        expect(result2).toEqual('[{"some":"metadata","_source":{"some":"data","more":"data"}}]');
        expect(result3).toEqual('[{"some":"data","more":"data"}]');

    });

    it('parsePath will format your paths to have a trailing /', function() {
        var path = 'somePath';
        var results = file_sender.parsePath(path);

        expect(results).toEqual('somePath/');
    });

    it('makeFolders will make date specific directories split up by the interval specified', function() {
        var context = {};
        var op = {path: path};
        var operations = [{
            interval: "5_mins",
            start: "2015-07-08T07:00:00",
            end: "2015-07-08T07:10:00"
        }];
        var jobConfig = {
            logger: {
                info: function() {
                }
            },
            operations: operations
        };

        file_sender.makeFolders(context, op, jobConfig);
        var results = fs.readdirSync(path);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual('2015-07-08T07:00:00+00:00');
        expect(results[1]).toEqual('2015-07-08T07:05:00+00:00');
        expect(results[2]).toEqual('2015-07-08T07:10:00+00:00');

    });

    it('mkdirSync will make a directory but not throw an error if it already exists', function() {
        var isDir = fs.statSync(path).isDirectory();

        expect(isDir).toBeTruthy();
        expect(function() {
            file_sender.mkdirSync(path)
        }).not.toThrowError();

    });

    it('findDir returns the appropriate directory for the data to be stored in', function() {
        //directories for this will be the ones created in makeFolders test
        var date1 = {start: '2015-07-08T07:00:00'};
        var date2 = {start: '2015-07-08T07:03:00'};
        var date3 = {start: '2015-07-08T07:10:00'};

        var result1 = file_sender.findDir(path, date1);
        var result2 = file_sender.findDir(path, date2);
        var result3 = file_sender.findDir(path, date3);

        expect(result1).toEqual('2015-07-08T07:00:00+00:00');
        expect(result2).toEqual('2015-07-08T07:00:00+00:00');
        expect(result3).toEqual('2015-07-08T07:10:00+00:00');

    });

    it('newSender saves data in the right folder', function(done) {
        var context = {};
        var opConfig = {path: path};
        var operations = [{
            interval: "5_mins",
            start: "2015-07-08T07:00:00",
            end: "2015-07-08T07:10:00"
        }];
        var jobConfig = {
            logger: {
                info: function() {
                }
            },
            operations: operations
        };
        var message1 = {start: "2015-07-08T07:00:00"};
        var message2 = {start: "2015-07-08T07:06:00"};
        var data = [{some: 'data'}];
        var parsedData = JSON.stringify(data);

        var sender = file_sender.newSender(context, opConfig, jobConfig);

        var result1 = sender(data, message1);
        var result2 = sender(data, message2);

        Promise.all([result1, result2]).then(function() {
            var data1 = fs.readFileSync(path + '/2015-07-08T07:00:00+00:00/2015-07-08T07:00:00', 'utf8');
            var data2 = fs.readFileSync(path + '/2015-07-08T07:05:00+00:00/2015-07-08T07:06:00', 'utf8');

            expect(data1).toEqual(parsedData);
            expect(data2).toEqual(parsedData);
            done();
        })
    });

});