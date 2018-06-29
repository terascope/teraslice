'use strict';

// given k8s information, generates teraslice cluster state

/**
 * Given the k8s Pods API output generates the appropriate Teraslice cluster
 * state
 * @param  {Object} k8sPods      k8s pods API object (k8s v1.10)
 * @param  {Object} clusterState Teraslice Cluster State
 */
function gen(k8sPods, clusterState) {
    // Loop over the nodes in clusterState and set active = [] so we can append
    // later
    Object.keys(clusterState).forEach((nodeId) => {
        clusterState[nodeId].active = [];
    });

    // add a worker for each pod
    k8sPods.items.forEach((element) => {
        if (!Object.prototype.hasOwnProperty.call(clusterState, element.status.hostIP)) {
            // If the node isn't in clusterState, add it
            clusterState[element.status.hostIP] = {
                node_id: element.status.hostIP,
                hostname: element.status.hostIP,
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
            worker_id: element.metadata.name,
            assignment: element.metadata.labels.nodeType,
            pid: element.metadata.name,
            ex_id: element.metadata.labels.exId,
            job_id: element.metadata.labels.jobId,
            pod_ip: element.status.podIP,
            assets: []
        };

        clusterState[element.status.hostIP].active.push(worker);
    });
}

exports.gen = gen;
