'use strict';

module.exports = function(config) {
    var request = require('./request')(config);
    var isStream = true;
    
    function postAsset(stream) {
        return request.post('/assets', stream , isStream)
    }

    function deleteAsset(id) {
        return request.delete(`/assets/${id}`);
    }

    return {
        post: postAsset,
        delete: deleteAsset
    }
};