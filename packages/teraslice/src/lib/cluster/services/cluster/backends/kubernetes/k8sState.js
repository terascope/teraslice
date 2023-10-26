'use strict';

const _ = require('lodash');

/**
 * Given the k8s Pods API output generates the appropriate Teraslice cluster
 * state.  NOTE: This assumes the pods have already been filtered to ensure they
 * are teraslice pods and match the cluster in question.
 * @param  {Object} k8sPods          k8s pods API object (k8s v1.10+)
 * @param  {Object} clusterState     Teraslice Cluster State
 * @param  {String} clusterNameLabel k8s label containing clusterName
 */
function gen(k8sPods, clusterState) {
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
        if (!_.has(clusterState, pod.status.hostIP)) {
            // If the node isn't in clusterState, add it
            clusterState[pod.status.hostIP] = {
                node_id: pod.status.hostIP,
                hostname: pod.status.hostIP,
                pid: 'N/A',
                node_version: 'N/A',
                teraslice_version: 'N/A',
                total: 'N/A',
                state: 'connected',
                available: 'N/A',
                active: []
            };
        }

        const worker = {
            assets: [],
            assignment: pod.metadata.labels['app.kubernetes.io/component'],
            ex_id: pod.metadata.labels['teraslice.terascope.io/exId'],
            // WARNING: This makes the assumption that the first container
            // in the pod is the teraslice container.  Currently it is the
            // only container, so this assumption is safe for now.
            image: pod.spec.containers[0].image,
            job_id: pod.metadata.labels['teraslice.terascope.io/jobId'],
            pod_name: pod.metadata.name,
            pod_ip: pod.status.podIP,
            worker_id: pod.metadata.name,
        };

        // k8s pods can have status.phase = `Pending`, `Running`, `Succeeded`,
        // `Failed`, `Unknown`.  We will only add `Running` pods to the
        // Teraslice cluster state.
        if (pod.status.phase === 'Running') {
            clusterState[pod.status.hostIP].active.push(worker);
        }
    });
}

exports.gen = gen;
