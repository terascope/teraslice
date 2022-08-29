import { debugLogger } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
import { TasksListParams } from '../../src/elasticsearch-client/method-helpers';
import {
    getDistributionAndVersion
} from '../helpers/elasticsearch';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('tasks.list', () => {
    let wrappedClient: WrappedClient;
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);
    });

    it('should return tasks', async () => {
        const params: TasksListParams = {
            group_by: 'nodes',
            timeout: '60s'
        };

        const resp = await wrappedClient.tasks.list(params);

        expect(resp.nodes).toBeDefined();
    });

    it('should return tasks with more parameters', async () => {
        const params: TasksListParams = {
            group_by: 'none',
            timeout: '60s',
            detailed: true
        };

        const resp = await wrappedClient.tasks.list(params);

        expect(resp.tasks).toBeDefined();
    });
});
