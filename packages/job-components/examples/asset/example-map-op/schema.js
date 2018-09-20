'use strict';

class Schema {
    static type() {
        return 'convict';
    }

    build(context) { // eslint-disable-line no-unused-vars
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            }
        };
    }
}

module.exports = Schema;
