'use strict';

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
        ts_gen1:59654d64-95a8-4dd5-9634-1734c2f62f37
        cluster:ex:# ex_id
        ts_gen1:ex:59654d64-95a8-4dd5-9634-1734c2f62f37
        cluster:job:# job
        ts_gen1:job:d0cd6381-488f-4fa7-ab7b-59388cc7728c
        cluster:job:* implies all jobs
        ts_gen1:job:*
        cluster:* context of which command was used implies job or ex?  Leaning towards ex
        ts_gen1:*
        * implies all clusters
        TODO add context job/ex etc should lead to a simplification
         */
        const types = ['asset', 'job', 'ex'];
        const hand = {};
        let pos = 1;
        hand.string = str;
        if (valid(str)) {
            const handArray = _.split(str, ':');
            hand.cluster = handArray[0];
            console.log(`cluster: ${hand.cluster}`);
            if (types.indexOf(handArray[1]) > -1) {
                hand.type = handArray[1];
                pos = 2;
            }
            if (validId(handArray[pos]) || handArray[pos] === '*') {
                hand.id = handArray[pos];
            } else if (_.endsWith(handArray[pos], '.json')) {
                hand.file = handArray[pos];
            }
        } else {
            hand.cluster = str;
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
        idCheck
    };
};
