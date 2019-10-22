import yargs from 'yargs';
import tmp from 'tmp';
import path from 'path';
import { TerasliceServer, GithubServer } from '../../servers';

import deploy from '../../../src/cmds/assets/deploy';
import nock from 'nock';

function wasApiCalled(arr: string[], endpoint: string) {
    const results = arr.find((str) => str.includes(endpoint))
    if (results != null) return false;
    return true;
}

describe('assets deploy', () => {
    let yargsCmd: yargs.Argv<{}>
    beforeEach(() => {
        yargsCmd = yargs.command(
            // @ts-ignore
            deploy.command,
            deploy.describe,
            deploy.builder,
            () => true
        );
    });

    describe('-> parse', () => {
        // TODO: test for conflicts
        it('should parse properly', () => {
            const yargsResult = yargsCmd.parse(
                'deploy ts-test1 terascope/file-assets', {}
            );

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.asset).toEqual('terascope/file-assets');
        });

        it('should parse options properly', () => {

            const yargsResult = yargsCmd.parse(
                'deploy ts-test1 terascope/file-assets --arch x64 --config-dir somedir --node-version 6 --quiet true --src-dir sourceDir'
            );

            expect(yargsResult.arch).toEqual('x64');
            expect(yargsResult['config-dir']).toEqual('somedir');
            expect(yargsResult['node-version']).toEqual('6');
            expect(yargsResult['quiet']).toEqual(true);
            expect(yargsResult['src-dir']).toEqual('sourceDir');
        });
    });

    describe('-> handler', () => {
        const assetPath = path.join(__dirname, '../../fixtures/regularAsset.zip');
        const configDir = path.join(__dirname, '../../fixtures/config_dir');
        const githubServer = new GithubServer();
        const terasliceServer = new TerasliceServer();
        const { handler } = deploy;
        let tmpDir: tmp.DirResult;
        let teraNock: nock.Scope;

        beforeEach(() => {
            githubServer.init();
            teraNock = terasliceServer.init();
            tmpDir = tmp.dirSync({ unsafeCleanup: true });
        });

        afterEach(() => {
            githubServer.close();
            terasliceServer.init();
            tmpDir.removeCallback();
        });

        it('should deploy a file', async () => {
            const argv = yargsCmd.parse(`deploy localhost --config-dir ${configDir}  -f ${assetPath}`)
            await handler(argv);
            expect(wasApiCalled(teraNock.activeMocks(), '/v1/assets')).toBeTrue;
        });

        it('should deploy an asset', async () => {
            const argv = yargsCmd.parse(`deploy localhost --config-dir ${configDir} terascope/elasticsearch-assets`)
            await handler(argv);
            expect(wasApiCalled(teraNock.activeMocks(), '/v1/assets')).toBeTrue;
        });

        it('should deploy a versioned asset', async () => {
            const argv = yargsCmd.parse(`deploy localhost --config-dir ${configDir} terascope/elasticsearch-assets@v9.9.9`)
            await handler(argv);
            console.log('what is scope here', teraNock)
            expect(wasApiCalled(teraNock.activeMocks(), '/v1/assets')).toBeTrue;
        });
    });
});
