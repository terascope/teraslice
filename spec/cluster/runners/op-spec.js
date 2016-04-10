var Promise = require('bluebird');
var fs = require('fs');

var global_context = {
    sysconfig: {
        teraslice: {
            ops_directory: process.cwd() + '/testing_for_teraslice'
        }
    }
};

var runner = require('../../../lib/cluster/runners/op')(global_context);

var internal = runner.__test_context();

describe('op_runner', function() {
    var path = process.cwd() + '/testing_for_teraslice';
    var subPath = path + '/subdir';

    //will set in stateLog test
    var subPathState;

    function deleteFolder(path) {
        try {
            fs.readdirSync(path).forEach(function(file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolder(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
        catch (e) {

        }
    }

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
            fs.mkdirSync(path + '/readers');
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

        try {
            fs.mkdirSync(subPath);
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }

        fs.writeFileSync(path + '/readers/elasticsearch_reader.js', 'module.exports =' + data1);
        fs.writeFileSync(path + '/file2.js', data2);
        fs.writeFileSync(subPath + '/file3.js', data3);

    });

    afterAll(function() {

        //remove enviroment variable
        delete process.env.job;

        deleteFolder(path);

    });


    it('load will try to get code at ops_directery first before checking own directory', function() {
        var jobConfig = {_op: 'elasticsearch_reader'};

        var results1 = runner.load('readers', jobConfig._op);
        // Second result with no ops_directory defined
        runner = require('../../../lib/cluster/runners/op')({
            sysconfig: {
                teraslice: {}
            }
        });
        var results2 = runner.load('readers', jobConfig._op);

        expect(results1).toEqual([{first: 'data', more: {data: 'in here'}}]);
        expect(results2.newReader).toBeDefined();
        expect(results2.schema).toBeDefined();

    });

    it('isString will throw error if not given a string', function() {
        expect(function() {
            internal.isString('iAmASting')
        }).not.toThrowError();
        expect(function() {
            internal.isString(45)
        }).toThrowError();
        expect(function() {
            internal.isString(['a string'])
        }).toThrowError();

    });
})