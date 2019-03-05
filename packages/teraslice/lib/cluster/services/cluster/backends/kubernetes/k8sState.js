'use strict';

const _ = require('lodash');

const terasliceVersion = require('../../../../../../package.json').version;

// given k8s information, generates teraslice cluster state

/**
 * Given the k8s Pods API output generates the appropriate Teraslice cluster
 * state
 * @param  {Object} k8sPods          k8s pods API object (k8s v1.10)
 * @param  {Object} clusterState     Teraslice Cluster State
 * @param  {String} clusterNameLabel k8s label containing clusterName
 */
function gen(k8sPods, clusterState, clusterNameLabel) {
    // Make sure we clean up the old
    const hostIPs = _.uniq(_.map(k8sPods.items, 'status.hostIP'));
    const oldHostIps = _.difference(_.keys(clusterState), hostIPs);
    _.forEach(oldHostIps, (ip) => {
        delete clusterState[ip];
    });

    // Loop over the nodes in clusterState and set active = [] so we can append
    // later
    Object.keys(clusterState).forEach((nodeId) => {
        clusterState[nodeId].active = [];
    });

    // add a worker for each pod
    k8sPods.items.forEach((pod) => {
        // Teraslice workers and execution controllers have the `clusterName`
        // label that matches their cluster name attached to their k8s pods.
        // If these labels don't match the supplied `clusterNameLabel`
        // then it is assumed that the pod is not a member of this cluster
        // so it is omitted from clusterState.
        // NOTE: The cluster master will not appear in cluster state if they do
        // not label it with clusterName=clusterNameLabel
        if (pod.metadata.labels.clusterName === clusterNameLabel) {
            if (!_.has(clusterState, pod.status.hostIP)) {
                // If the node isn't in clusterState, add it
                clusterState[pod.status.hostIP] = {
                    node_id: pod.status.hostIP,
                    hostname: pod.status.hostIP,
                    pid: 'N/A',
                    node_version: process.version,
                    teraslice_version: terasliceVersion,
                    total: 'N/A',
                    state: 'connected',
                    available: 'N/A',
                    active: []
                };
            }

            const worker = {
                worker_id: pod.metadata.name,
                assignment: pod.metadata.labels.nodeType,
                pid: pod.metadata.name,
                ex_id: pod.metadata.labels.exId,
                job_id: pod.metadata.labels.jobId,
                pod_ip: pod.status.podIP,
                assets: []
            };

            // k8s pods can have status.phase = `Pending`, `Running`, `Succeeded`,
            // `Failed`, `Unknown`.  We will only add `Running` pods to the
            // Teraslice cluster state.
            if (pod.status.phase === 'Running') {
                clusterState[pod.status.hostIP].active.push(worker);
            }
        }
    });
}

exports.gen = gen;
