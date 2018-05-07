'use strict';

const convict = require('convict');
const sysSchema = require('../../../lib/config/schemas/system');
const convictFormats = require('../../../lib/utils/convict_utils');

describe('system_schema', () => {
    convictFormats.forEach((format) => {
        convict.addFormat(format);
    });

    const schema = sysSchema.config_schema({});

    function checkValidation(config) {
        const validator = convict(schema);
        validator.load(config);
        try {
            validator.validate();
            return validator.getProperties();
        } catch (err) {
            return err.message;
        }
    }

    it('schema has defaults', () => {
        expect(sysSchema.schema.ops_directory).toBeDefined();
        expect(sysSchema.schema.shutdown_timeout).toBeDefined();
        expect(sysSchema.schema.reporter).toBeDefined();
        expect(sysSchema.schema.hostname).toBeDefined();
        expect(schema).toBeDefined();
        expect(schema.port.default).toEqual(5678);
        expect(schema.name.default).toEqual('teracluster');
        expect(schema.state.default).toEqual({ connection: 'default' });
    });

    it('ops_directory is optional but requires a string', () => {
        checkValidation({ ops_directory: 234 });
        checkValidation({ assets_directory: 234 });
    });
});
