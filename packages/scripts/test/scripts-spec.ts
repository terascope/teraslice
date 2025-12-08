import 'jest-extended';

import {
    dockerRun, dockerStop, getContainerInfo,
    dockerPull, DockerRunOptions
} from '../src/helpers/scripts';

describe('scripts', () => {
    describe('dockerRun', () => {
        const names = [
            'opensearch_no_tag',
            'opensearch_bad_image',
            'opensearch_used_port1',
            'opensearch_used_port2'
        ];

        beforeEach(async () => {
            await ensureStopped(names);
        });

        afterAll(async () => {
            await ensureStopped(names);
        });

        it('should throw an error if version does not exist', async () => {
            const dockerOptions: DockerRunOptions = {
                image: 'opensearchproject/opensearch',
                name: 'opensearch_no_tag',
                ports: ['49210:49210'],
                env: {
                    ES_JAVA_OPTS: '-Xms512m -Xmx512m',
                    'network.host': '0.0.0.0',
                    'http.port': '49210',
                    'discovery.type': 'single-node',
                    DISABLE_INSTALL_DEMO_CONFIG: true,
                    DISABLE_SECURITY_PLUGIN: true
                },
                network: undefined
            };

            try {
                await dockerRun(dockerOptions, '0.1.0', false, false);
                throw new Error('should have thrown');
            } catch (err) {
                expect(err.message.match(/w*Unable to find image*\w/)).not.toBeNull();
            }
        });
    });

    describe('dockerPull', () => {
        it('should throw an error if image is incorrect', async () => {
            await expect(dockerPull('yomama/hasabadimage')).rejects.toThrowWithMessage(Error, /w*repository does not exist*\w/);
        });
    });
});

async function ensureStopped(containerNames: string[]) {
    await Promise.all(containerNames.map(async (n) => {
        const resp = await getContainerInfo(n);
        if (resp) return dockerStop(n);
    }));
}
