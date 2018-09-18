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
    async function add(action) {
        const message = `${action}ed jobs on ${cliConfig.c}`;
        await send(cliConfig.config.annotations[cliConfig.config.env].host, cliConfig.config.annotations[cliConfig.env].key, ['global', 'teraslice'], message);
    }
    return {
        add
    };
};
