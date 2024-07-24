import 'jest-extended';
import { TSError } from '@terascope/utils';
import * as services from '../src/helpers/test-runner/services';
import { TestOptions } from '../src/helpers/test-runner/interfaces';

jest.mock('../src/helpers/config', () => ({
    ...jest.requireActual('../src/helpers/config'),
    ELASTICSEARCH_VERSION: 'bad-version',
    KAFKA_VERSION: 'very-bad-version',
    KAFKA_IMAGE_VERSION: 'very-bad-version',
    ZOOKEEPER_VERSION: 'very-bad-version',
    MINIO_VERSION: 'very-bad-version',
    RABBITMQ_VERSION: 'very-bad-version',
    OPENSEARCH_VERSION: 'very-bad-version',
}));

describe('services', () => {
    const options: TestOptions = {
        bail: false,
        debug: false,
        watch: false,
        trace: false,
        all: false,
        keepOpen: false,
        reportCoverage: false,
        useExistingServices: false,
        encryptMinio: false,
        ignoreMount: false,
        testPlatform: 'native',
        kindClusterName: 'default'
    };

    describe('loadOrPullServiceImages', () => {
        it('should throw error if service image is invalid', async () => {
            await expect(services.loadOrPullServiceImages('_for_testing_'))
                .rejects.toThrowWithMessage(TSError, /w*Failed to pull services for test suite*\w/);
        });
    });

    describe('ensureServices', () => {
        it('should throw if service has an incorrect setting', async () => {
            await expect(services.ensureServices('_for_testing_', options))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should log error from ensureKafka if bad options', async () => {
            await expect(services.ensureKafka(options))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should log error from ensureElasticsearch if bad options', async () => {
            await expect(services.ensureElasticsearch(options))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should log error from ensureMinio if bad options', async () => {
            await expect(services.ensureMinio(options))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should throw error from ensureOpensearch if bad options', async () => {
            await expect(services.ensureOpensearch(options))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });
    });
});
