'use strict';

// given k8s information, generates teraslice cluster state

/**
 * Given the k8s Pods API output generates the appropriate Teraslice cluster
 * state
 * @param  {Object} k8sPods      k8s pods API object (k8s v1.10)
 * @param  {Object} clusterState Teraslice Cluster State
 */
function gen(k8sPods, clusterState) {
    // Start by adding all k8s nodes
    // We have to do this in a seperate loop to preserve the active
    // list.
    // NOTE: by using the pods API, only nodes which currently have
    // running pods will show up in the nodes list.  If we used the
    // nodes api we would see all nodes.  Sadly this version of the
    // k8s node client did not implement the nodes endpoint.
    // Maybe this changes in newer releases.  It's probably best to
    // avoid looping over the list of pods twice if possible.
    k8sPods.items.forEach((element) => {
        clusterState[element.status.hostIP] = {
            node_id: element.status.hostIP,
            hostname: element.status.hostIP,
            pid: 1,
            node_version: 'N/A',
            teraslice_version: 'N/A',
            total: 42,
            state: 'connected', // FIXME: I had set this to
                                // k8s_connected but that wouldn't
                                // work because
                                // execution._iterateState() expects
                                // it to be connected.
            available: 42,
            active: []
        };
    });

    // next add workers
    k8sPods.items.forEach((element) => {
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
