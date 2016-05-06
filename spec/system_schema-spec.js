'use strict';

var sysSchema = require('../lib/config/schemas/system');

describe('system_schema', function() {

    it('schema has defaults', function() {

        expect(sysSchema.schema.ops_directory).toBeDefined();
        expect(sysSchema.schema.shutdown_timeout).toBeDefined();
        expect(sysSchema.schema.reporter).toBeDefined();
        expect(sysSchema.schema.hostname).toBeDefined();

    });

    it('cluster schema', function() {

        var schema = sysSchema.config_schema({teraslice: {cluster: true}});

        expect(schema.cluster).toBeDefined();
        expect(schema.cluster.port.default).toEqual(5678);
        expect(schema.cluster.name.default).toEqual('teracluster');
        expect(schema.cluster.state.default).toEqual({connection: 'default'});

    });

});