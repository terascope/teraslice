import 'jest-extended';
import { TSError } from '@terascope/utils';
import * as services from '../src/helpers/test-runner/services';
import { TestOptions } from '../src/helpers/test-runner/interfaces';

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
        elasticsearchVersion: 'bad-version',
        kafkaVersion: 'very-bad-version',
        kafkaImageVersion: 'very-bad-version',
        zookeeperVersion: 'very-bad-version',
        minioVersion: 'very-bad-version',
        encryptMinio: false,
        rabbitmqVersion: 'very-bad-version',
        opensearchVersion: 'very-bad-version',
        nodeVersion: 'very-bad-version',
        ignoreMount: false,
        testPlatform: 'native',
        kindClusterName: 'default'
    };

    describe('loadOrPullServiceImages', () => {
        it('should throw error if service image is invalid', async () => {
            await expect(services.loadOrPullServiceImages('_for_testing_', options))
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
