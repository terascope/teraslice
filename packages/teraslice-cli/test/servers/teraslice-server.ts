import nock from 'nock';
import { RootResponse, AssetIDResponse } from 'teraslice-client-js';

// TODO: take note of node_version
const rootResponse: RootResponse = {
    arch: 'x64',
    clustering_type: 'native',
    name: 'teracluster',
    node_version: 'v10.15.3',
    platform: 'darwin',
    teraslice_version: 'v0.56.3'
};

const postAssetResponse: AssetIDResponse = {
    _id: 'assset_test_id'
};


export default class TerasliceServer {
    init(): nock.Scope {
        const scope = nock('http://localhost:5678')
            .get('/v1/')
            .reply(200, rootResponse)
            .post('/v1/assets')
            .reply(201, postAssetResponse);

        return scope;
    }
}
