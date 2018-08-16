'use strict';

const signale = require('signale');
const misc = require('./misc');

module.exports = async () => {
    signale.pending('Bringing docker-compose down...');
    try {
        await misc.compose.down({
            timeout: 5,
        });
    } catch (err) {
        signale.success('Docker environment should be down');
        return;
    }
    signale.success('Docker environment is down');
};
