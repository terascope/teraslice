import type { Client, NodesInfoParams, NodesStatsParams } from 'elasticsearch';

/**
 * Get Cluster Metadata and Stats
 *
 * @todo this is not complete
*/
export class Cluster {
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    /**
     * Get the Cluster Nodes Info
    */
    async nodeInfo(_params: NodesInfoParams): Promise<unknown> {
        throw new Error('This function is not implemented yet');
    }

    /**
     * Get the Cluster Nodes Stats
    */
    async nodeStats(_params: NodesStatsParams): Promise<unknown> {
        throw new Error('This function is not implemented yet');
    }
}
