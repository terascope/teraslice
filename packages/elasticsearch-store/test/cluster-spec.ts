import 'jest-extended';
import { Cluster } from '../src';
import { makeClient } from './helpers/elasticsearch';

describe('Cluster', () => {
    let client: any;
    let cluster: Cluster;

    beforeAll(async () => {
        client = await makeClient();
        cluster = new Cluster(client);
    });

    it('should be an instance of Cluster', () => {
        expect(cluster).toBeInstanceOf(Cluster);
    });

    it('should have a nodeInfo function', () => {
        expect(cluster.nodeInfo).toBeFunction();
    });

    it('should have a nodeStats function', () => {
        expect(cluster.nodeStats).toBeFunction();
    });
});
