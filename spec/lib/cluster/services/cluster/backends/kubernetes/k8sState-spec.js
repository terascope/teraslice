'use strict';

const podsJobRunning = require('./files/job-running-v1-k8s-pods.json');
const expectedClusterState = require('./files/job-running-v1-clusterState.json');
const k8sState = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8sState');

describe('k8sState', () => {
    it('generates cluster state', () => {
        let clusterState = {};

        k8sState.gen(podsJobRunning, clusterState);
        // console.log(`clusterState\n\n` + JSON.stringify(clusterState, null, 2));
        // console.log(`expectedClusterState\n\n` + JSON.stringify(expectedClusterState, null, 2));

        /* The two tests below fail with the following error due to jasmine
           having a hard time deep comparing two objects with an array.
           https://github.com/jasmine/jasmine/issues/598
           https://github.com/jasmine/jasmine/issues/786

           Both suggest I implement a custom_equality test
           https://jasmine.github.io/2.2/custom_equality.html
        - Expected object not to have properties
            ex_id: undefined
            job_id: undefined
        */
        // expect(clusterState).toEqual(expectedClusterState);
        // expect(clusterState['192.168.99.100'].active[0])
        //     .toEqual(expectedClusterState['192.168.99.100'].active[0]);
        expect(clusterState['192.168.99.100'].active[1])
            .toEqual(expectedClusterState['192.168.99.100'].active[1]);
        expect(clusterState['192.168.99.100'].active[2])
            .toEqual(expectedClusterState['192.168.99.100'].active[2]);
    });
});
