import yargs from 'yargs';
import tmp from 'tmp';
import path from 'node:path';
import nock from 'nock';
import { GithubServer } from '../../servers';

import deploy from '../../../src/cmds/assets/deploy';

describe('assets deploy', () => {
    let yargsCmd: yargs.Argv<Record<string, any>>;
    beforeEach(() => {
        yargsCmd = yargs.command(
            // @ts-expect-error
            deploy.command,
            deploy.describe,
            deploy.builder,
            () => true
        );
    });

    describe('-> parse', () => {
        // TODO: test for conflicts
        it('should parse properly', () => {
            const yargsResult = yargsCmd.parseSync(
                'deploy ts-test1 terascope/file-assets', {}
            );

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.asset).toEqual('terascope/file-assets');
        });

        it('should parse options properly', () => {
            const yargsResult = yargsCmd.parseSync(
                'deploy ts-test1 terascope/file-assets --arch x64 --config-dir somedir --node-version 6 --quiet true --src-dir sourceDir'
            );

            expect(yargsResult.arch).toEqual('x64');
            expect(yargsResult['config-dir']).toEqual('somedir');
            expect(yargsResult['node-version']).toEqual('6');
            expect(yargsResult.quiet).toEqual(true);
            expect(yargsResult['src-dir']).toEqual('sourceDir');
        });
    });

    describe('-> handler', () => {
        const assetPath = path.join(__dirname, '../../fixtures/regularAsset.zip');
        const configDir = path.join(__dirname, '../../fixtures/config_dir');
        const githubServer = new GithubServer();
        const { handler } = deploy;
        let tmpDir: tmp.DirResult;
        let teraNock: nock.Scope;

        /**
         * FIXME The mocking here is pretty bad.
        */

        beforeEach(() => {
            githubServer.init();
            teraNock = nock('http://localhost:5678');

            tmpDir = tmp.dirSync({ unsafeCleanup: true });
        });

        afterEach(() => {
            nock.cleanAll();
            tmpDir.removeCallback();
        });

        it('should deploy a file', async () => {
            const argv = yargsCmd.parseSync(`deploy localhost --config-dir ${configDir}  -f ${assetPath}`);

            teraNock.post('/v1/assets').reply(201, {
                _id: 'assset_test_id'
            });

            await handler(argv);
            teraNock.done();
        });

        it('should deploy an asset', async () => {
            const argv = yargsCmd.parseSync(`deploy localhost --config-dir ${configDir} terascope/elasticsearch-assets`);
            teraNock
                .get('/v1/')
                .reply(200, {
                    arch: 'x64',
                    clustering_type: 'native',
                    name: 'teracluster',
                    node_version: 'v10.15.3',
                    platform: 'darwin',
                    teraslice_version: 'v0.56.3'
                })
                .post('/v1/assets')
                .reply(201, {
                    _id: 'assset_test_id'
                });

            await handler(argv);
            teraNock.done();
        });

        it('should deploy a versioned asset', async () => {
            const argv = yargsCmd.parseSync(`deploy localhost --config-dir ${configDir} terascope/elasticsearch-assets@v9.9.9`);
            teraNock
                .get('/v1/')
                .reply(200, {
                    arch: 'x64',
                    clustering_type: 'native',
                    name: 'teracluster',
                    node_version: 'v10.15.3',
                    platform: 'darwin',
                    teraslice_version: 'v0.56.3'
                })
                .post('/v1/assets')
                .reply(201, {
                    _id: 'assset_test_id'
                });

            await handler(argv);
            teraNock.done();
        });
    });
});
