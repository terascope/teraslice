'use strict';


function elasticError(err) {
    if (err.toJSON) {
        var err = err.toJSON();
        if (err.msg) {
            return err.msg;
        }
        else {
            return "Unknown ES Error Format " + JSON.stringify(err);
        }
    }
    if (err.stack) {
        return err.stack
    }
    return err.response ? err.response : err;
}

module.exports = {
    elasticError: elasticError
};