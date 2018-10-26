'use strict';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');

module.exports = () => {
    function valid(str) {
        let isSh = false;
        if (str.indexOf(':') > -1) {
            isSh = true;
        }
        return (isSh);
    }

    function validId(str) {
        let isId = false;
        let dashCount = 0;
        let pos = str.indexOf('-');
        while (pos !== -1) {
            dashCount += 1;
            pos = str.indexOf('-', pos + 1);
        }
        if (dashCount === 4 && str.length === 36) {
            isId = true;
        }
        return (isId);
    }
    function parse(str) {
        /*
        cluster:#  implies cluster:ex_id
        cluster:ex:# ex_id
        cluster:job:# job
        cluster:job:* implies all jobs
        cluster:* context of which command was used implies job or ex?  Leaning towards ex
            * implies all clusters
        */
        const types = ['asset', 'job', 'ex'];
        const hand = {};
        let pos = 1;
        hand.string = str;
        if (valid(str)) {
            const handArray = _.split(str, ':');
            _.set(hand, 'cluster', handArray[0]);
            if (types.indexOf(handArray[1]) > -1) {
                _.set(hand, 'type', handArray[1]);
                pos = 2;
            }
            if (validId(handArray[pos]) || handArray[pos] === '*') {
                _.set(hand, 'id', handArray[pos]);
            } else if (_.endsWith(handArray[pos], '.json')) {
                _.set(hand, 'file', handArray[pos]);
            }
        } else {
            if (_.endsWith(str, '.json')) {
                hand.file = str;
            } else {
                hand.cluster = str;
            }
        }
        return hand;
    }

    function idCheck(specId, responseId) {
        let includeId = false;
        if (specId === undefined || responseId.job_id === specId || responseId.ex_id === specId) {
            includeId = true;
        }
        return includeId;
    }

    return {
        parse,
        idCheck,
        valid
    };
};
