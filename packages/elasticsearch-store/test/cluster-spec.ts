import 'jest-extended';
import { Cluster } from '../src';
import { makeClient } from './helpers/elasticsearch';

describe('Cluster', () => {
    const client = makeClient();
    const cluster = new Cluster(client);

    afterAll(() => {
        client.close();
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
