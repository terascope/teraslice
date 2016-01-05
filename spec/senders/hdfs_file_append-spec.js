'use strict';

var hdfsSender = require('../../lib/senders/hdfs_file_append');
var Promise = require('bluebird');
var _ = require('lodash');

describe('hdfs_file_append', function(){

    var context = {
        foundation: {
            getConnection: function() {
                return {
                    client: {
                        getFileStatusAsync: function(){ return Promise.resolve()},
                        appendAsync: function(filename, chunk){ return [filename, chunk]},
                        count: function() {
                            if (clientData.length > 1) {
                                return Promise.resolve(clientData.shift())
                            }
                            return Promise.resolve(clientData[0])
                        },
                        indices: {
                            getSettings: function() {
                                return Promise.resolve({
                                    'someIndex': {
                                        settings: {
                                            index: {
                                                max_result_window: 10000
                                            }
                                        }
                                    }
                                })
                            }
                        },
                        cluster: {
                            stats: function() {
                                return Promise.resolve({nodes: {versions: ['2.1.1']}})
                            }
                        },
                        search: function() {
                            return Promise.resolve({
                                hits: {
                                    hits: clientData.map(function(obj) {
                                        return {_source: obj}
                                    })
                                }
                            })
                        }
                    }
                }
            }
        },
        logger: {
            info: function() {
            }
        }
    };

    it('has a schema and newSender method', function(){

        expect(hdfsSender).toBeDefined();
        expect(hdfsSender.newSender).toBeDefined();
        expect(hdfsSender.schema).toBeDefined();
        expect(typeof hdfsSender.newSender).toEqual('function');
        expect(typeof hdfsSender.schema).toEqual('function');

    });

    it('make append calls to elasticsearch', function(done){

        var opConfig = {};
        var jobConfig = {logger: function(){}};
        var data = [{filename: 'someFile.txt', data: 'some stuff'}];

        var sender = hdfsSender.newSender(context, opConfig, jobConfig);

        Promise.resolve(sender(data)).then(function(results){
            expect(_.flatten(results, true)).toEqual([data[0].filename, data[0].data]);

            done()
        });

    });

});