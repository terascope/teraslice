'use strict';


function elasticError(err) {
    if (err.toJSON) {
        return err.toJSON()
    }
    if (err.stack) {
        return err.stack
    }
    return err.response ? err.response : err;
}

module.exports = {
    elasticError: elasticError
};