'use strict';

var sysSchema = require('../lib/config/schemas/system');

describe('system_schema', function() {

    it('schema has defaults', function() {

        expect(sysSchema.schema.ops_directory).toBeDefined();
        expect(sysSchema.schema.shutdown_timeout).toBeDefined();
        expect(sysSchema.schema.reporter).toBeDefined();
        expect(sysSchema.schema.hostname).toBeDefined();

        var schema = sysSchema.config_schema({});

        expect(schema).toBeDefined();
        expect(schema.port.default).toEqual(5678);
        expect(schema.name.default).toEqual('teracluster');
        expect(schema.state.default).toEqual({connection: 'default'});

    });

});