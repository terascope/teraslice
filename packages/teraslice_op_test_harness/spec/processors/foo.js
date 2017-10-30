
'use strict';

// Add a field with static value `foo`.

function newProcessor(context, opConfig) {
    return function process(data) {
        const results = [];
        data.forEach((obj) => {
            obj[opConfig.field] = 'foo';
            results.push(obj);
        });
        return results;
    };
}

function schema() {
    return {
        field: {
            doc: 'Name of field to foo up.',
            default: 'foo',
            format: 'optional_String'
        }
    };
}

module.exports = { newProcessor, schema };
