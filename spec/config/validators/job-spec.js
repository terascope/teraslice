var Promise = require('bluebird');
var fs = require('fs');
var convict = require('convict');
var convictFormats = require('../../../lib/utils/convict_utils');

convictFormats.forEach(function(obj) {
    convict.addFormat(obj)
});

var global_context = {
    sysconfig: {
        teraslice: {
            cluster: {
                name: "testcluster"
            }
        }
    },
    foundation: {
    },
    cluster: {
        isMaster: true
    }
};

var job_validator = require('../../../lib/config/validators/job')(global_context);

var internal = job_validator.__test_context();

describe('job_runner', function() {

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
            internal.hasSchema(obj1, 'testing_for_teraslice')
        }).not.toThrowError();
        expect(function() {
            internal.hasSchema(obj2, 'testing_for_teraslice')
        }).toThrowError();
        expect(function() {
            internal.hasSchema(obj2, 'testing_for_teraslice')
        }).toThrowError();

    });

    it('validateOperation will validate convict schema\'s', function() {

        var context = {
            cluster: {
                isMaster: true
            }
        };
        var opSchema = {
            port: {default: 8000}, format: function(val) {
                return typeof val === 'number'
            }
        };

        var job = {_op: "someOP", port: 1234};
        var otherJob = {_op: "someOP", some: 'key'};

        var badJob = {some: 'key'};

        var results1 = internal.validateOperation(opSchema, job, true);
        var results2 = internal.validateOperation(opSchema, otherJob, true);

        expect(results1).toEqual({port: 1234, _op: 'someOP'});
        expect(results2).toEqual({port: 8000, _op: 'someOP', some: 'key'});

        expect(function() {
            internal.validateOperation(opSchema, badJob, true)
        }).toThrowError('_op: This field is required and must by of type string')

    });
});