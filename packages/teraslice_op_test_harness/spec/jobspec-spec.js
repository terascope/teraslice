var op = 'noop';
var harness = require('../index')({_op: op});


describe('With no extraOpConfig specified', function() {
    it('the second operation just contains _op', function() {
        expect(harness._jobSpec(op)).toEqual(
            {operations: [{_op: 'noop'}, {_op: 'noop'}]}
        );
    });
});


describe('With an extra option passed in through extraOpConfig', function() {
    var opConfig = {percentage: 100};

    it('that option gets merged into the second operation', function() {
        expect(harness._jobSpec(op, opConfig)).toEqual(
            {operations: [{_op: 'noop'}, {_op: 'noop', percentage: 100}]}
        );
    });
});
