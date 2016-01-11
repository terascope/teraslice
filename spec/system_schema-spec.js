'use strict';

var sysSchema = require('../system_schema');
var http = require('http');

describe('system_schema', function() {
    var server1;
    var server2;

    beforeAll(function() {
        server1 = http.createServer().listen(12345);
        server2 = http.createServer().listen(12346);
    });

    afterAll(function() {
        server1.close();
        server2.close();
    });

    it('schema has defaults', function() {

        expect(sysSchema.schema.teraslice_ops_directory).toBeDefined();
        expect(sysSchema.schema.shutdown_timeout).toBeDefined();
        expect(sysSchema.schema.reporter).toBeDefined();
        expect(sysSchema.schema.port).toBeDefined();
        expect(sysSchema.schema.host).toBeDefined();
        expect(sysSchema.schema.teraslice_ops_directory).toBeDefined();

    });

    it('portError will throw if called', function() {

        expect(function() {
            sysSchema.portError(5678)
        }).toThrowError('Port specified in config file is already in use, please specify another');

    });

    it('findPort will return a default, if in use it will recurse to give the next port open', function() {

        expect(sysSchema.findPort(12344)).toEqual(12344);
        expect(sysSchema.findPort(12345)).toEqual(12347);

        expect(function() {
            sysSchema.findPort(12345, sysSchema.portError)
        }).toThrowError('Port specified in config file is already in use, please specify another');

        expect(function() {
            sysSchema.findPort(12344, sysSchema.portError)
        }).not.toThrowError();

    });

});