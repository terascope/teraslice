'use strict';

/* drop_property.js - given an array of JSON documents will return an array
                of documents with the provided 'property' removed.  If the
                property does not exist, the document is returned unchanged.

    Example:

    ...
    {
        "_op": "drop_property",
        "property": "name"
    },
    ...

 */


function newProcessor(context, opConfig, jobConfig) {
    const jobLogger = context.logger;
    
    jobLogger.info('Drop_property asset loaded.');

    return function processor(data, sliceLogger, msg) {
        data.forEach((doc) => {
            if (doc.hasOwnProperty(opConfig.property)) {
                delete doc[opConfig.property];
            }
        });
        return data;
    };
}


function schema() {
    return {
        property: {
            doc: 'The property to be removed from incoming documents',
            format: String
        }
    };
}


module.exports = {
    newProcessor,
    schema,
};
