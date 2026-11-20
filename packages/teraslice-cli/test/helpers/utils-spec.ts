import 'jest-extended';
import nock from 'nock';
import { detectApiVersion } from '../../src/helpers/utils.js';

describe('detectApiVersion', () => {
    const host = 'http://test-host';
    const clusterInfo = {
        arch: 'x64',
        clustering_type: 'native',
        name: 'test-cluster',
        node_version: 'v22.0.0',
        platform: 'linux',
        teraslice_version: 'v3.1.0'
    };

    afterEach(() => {
        nock.cleanAll();
    });

    it('should return v2 when /v2 responds with cluster info', async () => {
        nock(host).get('/v2/')
            .reply(200, clusterInfo);
        await expect(detectApiVersion(host)).resolves.toEqual({ apiVersion: 'v2' });
    });

    it('should return v1 when /v2 is not found', async () => {
        nock(host).get('/v2/')
            .reply(404, 'Cannot GET /v2/');
        const result = await detectApiVersion(host);
        expect(result.apiVersion).toBe('v1');
        expect(result.reason).toContain('does not have the /v2 API');
    });

    it('should return v1 when /v2 responds with another error status', async () => {
        nock(host).get('/v2/')
            .reply(403, { error: 403, message: 'Forbidden' });
        const result = await detectApiVersion(host);
        expect(result.apiVersion).toBe('v1');
        expect(result.reason).toContain('responded to /v2 with status 403');
    });

    it('should return v1 when the api is not available yet', async () => {
        nock(host).get('/v2/')
            .reply(200, { error: 'api is not available' });
        const result = await detectApiVersion(host);
        expect(result.apiVersion).toBe('v1');
        expect(result.reason).toContain('still starting up');
    });

    it('should return v1 when /v2 responds with unexpected json', async () => {
        nock(host).get('/v2/')
            .reply(200, { foo: 'bar' });
        const result = await detectApiVersion(host);
        expect(result.apiVersion).toBe('v1');
        expect(result.reason).toContain('unexpected response');
    });

    it('should return v1 when /v2 responds with something other than json', async () => {
        nock(host).get('/v2/')
            .reply(200, '<html>proxy login</html>');
        const result = await detectApiVersion(host);
        expect(result.apiVersion).toBe('v1');
        expect(result.reason).toContain('something other than JSON');
    });

    it('should return v1 when the cluster is unreachable', async () => {
        nock(host).get('/v2/')
            .replyWithError({ code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' });
        const result = await detectApiVersion(host);
        expect(result.apiVersion).toBe('v1');
        expect(result.reason).toContain('unable to reach the cluster at http://test-host');
    });
});
