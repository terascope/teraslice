'use strict';

var fs = require('fs');
var file_reader = require('../../lib/readers/file_import');
var file_utils = require('../../lib/utils/file_utils');
var Promise = require('bluebird');

describe('file_import', function() {
    var path = process.cwd() + '/testing_for_teraslice';
    var subPath = path + '/subdir';

    beforeAll(function() {
        var data1 = JSON.stringify([{first: 'data', more: {data: 'in here'}}]);
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

        fs.writeFileSync(path + '/file1', data1);
        fs.writeFileSync(path + '/file2', data2);
        fs.writeFileSync(subPath + '/file3', data3);

    });

    afterAll(function() {
        var path = process.cwd();
        fs.unlinkSync(path + '/testing_for_teraslice/file1');
        fs.unlinkSync(path + '/testing_for_teraslice/file2');
        fs.unlinkSync(path + '/testing_for_teraslice/subdir/file3');
        fs.rmdirSync(path + '/testing_for_teraslice/subdir');
        fs.rmdirSync(path + '/testing_for_teraslice');

    });

    it('has a schema and newSlicer and newReader method', function() {
        var reader = file_reader;

        expect(reader).toBeDefined();
        expect(reader.newSlicer).toBeDefined();
        expect(reader.newReader).toBeDefined();
        expect(reader.schema).toBeDefined();
        expect(typeof reader.newSlicer).toEqual('function');
        expect(typeof reader.newReader).toEqual('function');
        expect(typeof reader.schema).toEqual('function');

    });

    it('schema function returns on object, formatted to be used by convict', function() {
        var schema = file_reader.schema();
        var type = Object.prototype.toString.call(schema);
        var keys = Object.keys(schema);

        expect(type).toEqual('[object Object]');
        expect(keys.length).toBeGreaterThan(0);
        expect(schema.path.default).toBeNull();

    });

    it('walk recursively goes through a directory and calls a function on each file', function() {
        var walk = file_utils.walk;
        var fileArray = [];

        walk(path, function(file) {
            fileArray.push(file)
        });

        expect(fileArray.length).toEqual(3);
        expect(fileArray[0]).toEqual(path + '/file1');
        expect(fileArray[1]).toEqual(path + '/file2');
        expect(fileArray[2]).toEqual(path + '/subdir/file3');

    });

    it('newSlicer is a queue that gives the next path', function(done) {
        var loggerData = [];
        var context = {};
        var opConfig = {path: path};
        var jobConfig = {
            readerConfig: opConfig,
            jobConfig: {
                logger: {
                    info: function(data) {
                        loggerData.push(data)
                    }
                }
            }
        };

        Promise.resolve(file_reader.newSlicer(context, jobConfig)).then(function(slicer) {
            Promise.resolve(slicer[0]())
                .then(function(data) {
                    expect(data).toEqual(path + '/file1');
                    return slicer[0]();
                }).then(function(data) {
                    expect(data).toEqual(path + '/file2');
                    return slicer[0]();
                }).then(function(data) {
                    expect(data).toEqual(path + '/subdir/file3');
                    done()
                });

        });
    });


    it('reader returns the data from the file', function(done) {
        var loggerData = [];
        var context = {};
        var opConfig = {path: path};
        var jobConfig = {
            readerConfig: opConfig,
            jobConfig: {
                logger: {
                    info: function(data) {
                        loggerData.push(data)
                    }
                }
            }
        };

        Promise.resolve(file_reader.newSlicer(context, jobConfig)).then(function(slicer) {
            var reader = file_reader.newReader(context, opConfig, jobConfig);
            Promise.resolve(slicer[0]()).then(function(data) {
                expect(reader(data)).toEqual([{first: 'data', more: {data: 'in here'}}]);
                return slicer[0]()
            }).then(function(data) {
                expect(reader(data)).toEqual([{second: 'data', more: {data: 'in here'}}]);
                return slicer[0]()
            }).then(function(data) {
                expect(reader(data)).toEqual([{third: 'data', more: {data: 'in here'}}]);
                done()
            })
        });

    });

});