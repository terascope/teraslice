/* eslint-disable jest/no-focused-tests */
import 'jest-extended';
import { TSError } from '@terascope/utils';

import {
    dockerRun,
    dockerStop,
    getContainerInfo,
    dockerPull
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
            const dockerOptions = {
                image: 'opensearchproject/opensearch',
                name: 'opensearch_no_tag',
                ports: ['49210:49210'],
                env: {
                    ES_JAVA_OPTS: '-Xms512m -Xmx512m',
                    'network.host': '0.0.0.0',
                    'http.port': '49210',
                    'discovery.type': 'single-node',
                    DISABLE_INSTALL_DEMO_CONFIG: 'true',
                    DISABLE_SECURITY_PLUGIN: 'true'
                },
                network: undefined
            };

            // await dockerRun(dockerOptions, '0.1.0', false, false)
            await expect(dockerRun(dockerOptions, '0.1.0', false, false)).rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should throw an error if image is unaccessible', async () => {
            const dockerOptions = {
                image: 'whatsupproject/notprojecthere',
                name: 'opensearch_bad_image',
                ports: ['49210:49210'],
                env: {
                    ES_JAVA_OPTS: '-Xms512m -Xmx512m',
                    'network.host': '0.0.0.0',
                    'http.port': '49210',
                    'discovery.type': 'single-node',
                    DISABLE_INSTALL_DEMO_CONFIG: 'true',
                    DISABLE_SECURITY_PLUGIN: 'true'
                },
                network: undefined
            };

            await expect(dockerRun(dockerOptions, '2.1.0', false, false)).rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should throw an error if same port is used for multiple services', async () => {
            const dockerOptions1 = {
                image: 'opensearchproject/opensearch',
                name: 'opensearch_used_port1',
                ports: ['49210:49210'],
                env: {
                    ES_JAVA_OPTS: '-Xms512m -Xmx512m',
                    'network.host': '0.0.0.0',
                    'http.port': '49210',
                    'discovery.type': 'single-node',
                    DISABLE_INSTALL_DEMO_CONFIG: 'true',
                    DISABLE_SECURITY_PLUGIN: 'true'
                },
                network: undefined
            };

            const dockerOptions2 = {
                image: 'opensearchproject/opensearch',
                name: 'opensearch_used_port2',
                ports: ['49210:49210'],
                env: {
                    ES_JAVA_OPTS: '-Xms512m -Xmx512m',
                    'network.host': '0.0.0.0',
                    'http.port': '49210',
                    'discovery.type': 'single-node',
                    DISABLE_INSTALL_DEMO_CONFIG: 'true',
                    DISABLE_SECURITY_PLUGIN: 'true'
                },
                network: undefined
            };

            const fn = Promise.all([
                dockerRun(dockerOptions1, '2.1.0', false, false),
                dockerRun(dockerOptions2, '2.1.0', false, false),
            ]);

            await expect(fn).rejects.toThrowWithMessage(TSError, /w*port is already allocated*\w/);
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