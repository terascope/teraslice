import 'jest-extended';
import es from 'elasticsearch';
import { Cluster } from '../src';

describe('Cluster', () => {
    const client = new es.Client({});
    const cluster = new Cluster(client);

    afterAll(() => {
        client.close();
    });

    it('should be an instance of Cluster', () => {
        expect(cluster).toBeInstanceOf(Cluster);
    });
});
