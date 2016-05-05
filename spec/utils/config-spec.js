'use strict';
var config = require('../../lib/utils/config');
var fs = require('fs');
var Queue = require('../../lib/utils/queue');

describe('config', function() {

    var path = process.cwd() + '/testing_for_teraslice';

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

    var job = JSON.stringify({
        "name": "Data Generator",
        "lifecycle": "once",
        "analytics": false,
        "operations": [
            {
                "_op": "elasticsearch_data_generator",
                "size": 5000,
                "file_path": "/Users/Projects/data.js"
            },
            {
                "_op": "elasticsearch_index_selector",
                "index": "bigdata5",
                "type": "events"
            },
            {
                "_op": "elasticsearch_bulk",
                "size": 5000
            }
        ]
    });

    //used for get job
    process.env.job = job;

    afterAll(function() {

        //remove enviroment variable
        delete process.env.job;

        deleteFolder(path);

    });

    it('compareDates will return the latest completed chunk', function() {

        var prev1 = {start: "2016-01-04T23:00:00+00:00", end: "2016-01-04T23:05:00+00:00"};
        var prev2 = {start: "2016-01-04T23:00:00+00:00", end: "2016-01-04T23:05:00+00:00"};
        var prev3 = {start: "2016-01-04T23:00:00+00:00"};
        var prev4 = {start: "2016-01-04T23:00:00+00:00", end: "2016-01-04T23:15:00+00:00"};

        var accum1 = {start: "2016-01-04T23:05:00+00:00", end: "2016-01-04T23:10:00+00:00"};
        var accum2 = {start: "2016-01-04T23:05:00+00:00"};
        var accum3 = {start: "2016-01-04T23:05:00+00:00", end: "2016-01-04T23:10:00+00:00"};
        var accum4 = {start: "2016-01-04T23:05:00+00:00", end: "2016-01-04T23:10:00+00:00"};

        expect(config.compareDates(prev1, accum1)).toEqual(accum1);
        expect(config.compareDates(prev2, accum2)).toEqual(prev2);
        expect(config.compareDates(prev3, accum3)).toEqual(accum3);
        expect(config.compareDates(prev4, accum4)).toEqual(prev4);

    });

    it('getClient returns client with certain defaults', function() {
        var context = {
            foundation: {
                getConnection: function(config) {
                    return {
                        client: function() {
                            return config;
                        }
                    }
                }
            }
        };
        var opConfig1 = {};
        var opConfig2 = {
            connection: 'otherConnection'
        };
        var opConfig3 = {
            connection: 'thirdConnection',
            connection_cache: false
        };

        var type = 'elasticsearch';

        var results1 = config.getClient(context, opConfig1, type);
        var results2 = config.getClient(context, opConfig2, type);
        var results3 = config.getClient(context, opConfig3, type);

        expect(typeof results1).toEqual('function');
        expect(results1()).toEqual({endpoint: 'default', cached: true, type: 'elasticsearch'});

        expect(typeof results2).toEqual('function');
        expect(results2()).toEqual({endpoint: 'otherConnection', cached: true, type: 'elasticsearch'});

        expect(typeof results3).toEqual('function');
        expect(results3()).toEqual({endpoint: 'thirdConnection', cached: false, type: 'elasticsearch'});

    });

});

