'use strict';

const request = require('request-promise');
const reply = require('./display')();

async function send(host, key, tags, text) {
    const timestamp = +new Date();
    const url = `http://${host}/api/annotations`;
    const payload = {
        time: timestamp,
        type: 'event',
        tags,
        text
    };
    const options = {
        method: 'POST',
        uri: url,
        headers: {
            Authorization: `Bearer ${key}`
        },
        body: payload,
        json: true
    };
    request(options)
        .then((response) => {
            if (response.message === 'Annotation added') {
                reply.green(`> Annotation: "${text}" Added`);
            }
        })
        .catch((err) => {
            reply.fatal(`> Annotation failed: ${err}`);
        });
}

module.exports = (cliConfig) => {
    async function add(action, job = '') {
        let message = '';
        if (job === '') {
            message = `${action}ed all jobs on ${cliConfig.cluster}`;
        } else {
            message = `${action}ed ${job} on ${cliConfig.cluster}`;
        }
        await send(cliConfig.config.annotations[cliConfig.annotation_env].host, cliConfig.config.annotations[cliConfig.annotation_env].key, ['global', 'teraslice'], message);
    }
    return {
        add
    };
};
