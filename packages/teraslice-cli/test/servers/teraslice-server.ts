
import nock from 'nock';
import { RootResponse, AssetsPostResponse } from 'teraslice-client-js';

// TODO: take note of node_version
const rootResponse: RootResponse = {
    arch: 'x64',
    clustering_type: 'native',
    name: 'teracluster',
    node_version: 'v10.15.3',
    platform: 'darwin',
    teraslice_version: 'v0.56.3'
};

const postAssetResponse: AssetsPostResponse = {
    _id: 'assset_test_id'
};

/**
 * @jsnoble FIXME: this is not a good way to test. This doesn't tests that the correct
 * data was sent and the api is too limiting.
 * Why not just nock directly? Also using `http://localhost:5678` is missleading and
 * can lead to requests hitting a local teraslice if misconfigured
*/
export default class TerasliceServer {
    init() {
        const scope = nock('http://localhost:5678')
            .get('/v1/')
            .reply(200, rootResponse)
            .post('/v1/assets')
            .reply(201, postAssetResponse);

        return scope;
    }
}
