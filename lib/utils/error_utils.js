'use strict';


function elasticError(err) {
    if (err.toJSON) {
        return err.toJSON()
    }
    return err.stack ? err.stack : err
}

module.exports = {
    elasticError: elasticError
};