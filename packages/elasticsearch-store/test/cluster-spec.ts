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

    it('should have a nodeInfo function', () => cluster.nodeInfo({ nodeId: 'hello' }));

    it('should have a nodeStats function', () => cluster.nodeStats({ nodeId: 'hello' }));
});
