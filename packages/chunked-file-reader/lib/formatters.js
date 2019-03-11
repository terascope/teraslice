'use strict';

const { DataEntity } = require('@terascope/utils');

// No parsing, leaving to reader or a downstream op.
function raw(data, logger, opConfig, metadata) {
    return data.map((record) => {
        try {
            return DataEntity.make(
                { data: record },
                metadata
            );
        } catch (err) {
            if (opConfig._dead_letter_action === 'log') {
                logger.error(err, 'Bad record:', record);
            } else if (opConfig._dead_letter_action === 'throw') {
                throw err;
            }
            return null;
        }
    });
}

function json(data, logger, opConfig, metadata) {
    return data.map((record) => {
        try {
            return DataEntity.fromBuffer(
                record,
                opConfig,
                metadata
            );
        } catch (err) {
            if (opConfig._dead_letter_action === 'log') {
                logger.error(err, 'Bad record:', record);
            } else if (opConfig._dead_letter_action === 'throw') {
                throw err;
            }
            return null;
        }
    });
}

module.exports = {
    raw,
    json
};
