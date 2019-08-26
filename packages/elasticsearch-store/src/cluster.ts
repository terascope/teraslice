import * as es from 'elasticsearch';

/** Get Cluster Metadata and Stats */
export default class Cluster {
    readonly client: es.Client;

    constructor(client: es.Client) {
        this.client = client;
    }

    /**
     * Get the Cluster Nodes Info
    */
    async nodeInfo(params: es.NodesInfoParams) {

    }

    /**
     * Get the Cluster Nodes Stats
    */
    async nodeStats(params: es.NodesStatsParams) {

    }
}
