'use strict';

function createNameSpace(job) {
    var jobName = job.name ? job.name : 'job';
    jobName = jobName.replace(' ','').trim();
    var id = job.id;

    return jobName + id;
}

function makeHostName(hostname, port, nameSpace) {
    var name;

    if (!hostname.match(/http/)) {
        hostname = 'http://' + hostname;
    }

    var lastChar = hostname[hostname.length - 1];

    if (lastChar !== ':') {
        name = hostname + ':' + port;
    }
    else {
        name = hostname + port;
    }

    if (nameSpace) {
        return name + '/' + nameSpace
    }

    return name;
}

module.exports = {
    createNameSpace: createNameSpace,
    makeHostName: makeHostName
};