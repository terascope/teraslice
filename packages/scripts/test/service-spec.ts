/* eslint-disable jest/no-focused-tests */
import { TSError } from '@terascope/utils';
import * as services from '../src/helpers/test-runner/services';
import { Service } from '../src/helpers/interfaces';

describe('services', () => {
    const options = {
        bail: false,
        debug: false,
        watch: false,
        trace: false,
        all: false,
        keepOpen: false,
        reportCoverage: false,
        useExistingServices: false,
        elasticsearchVersion: 'bad-version',
        elasticsearchAPIVersion: '6.8',
        kafkaVersion: 'very-bad-version',
        minioVersion: 'very-bad-version',
        rabbitmqVersion: 'very-bad-version',
        opensearchVersion: 'very-bad-version',
        ignoreMount: false
    };

    describe('pullServices', () => {
        it('should throw error if service image is invalid', async () => {
            await expect(services.pullServices('e2e', options))
                .rejects.toThrowWithMessage(TSError, /w*Failed to pull services for test suite*\w/);
        });
    });

    describe('ensureServices', () => {
        it('should throw if service has an incorrect setting', async () => {
            await expect(services.ensureServices('e2e', options))
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
    });

    describe('startServices', () => {
        it('should throw error if bad options passed to startServices for kafka', async () => {
            await expect(services.startService(options, Service.Kafka))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should throw error if bad options passed to startServices for minio', async () => {
            await expect(services.startService(options, Service.Minio))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should throw error if bad options passed to startServices for opensearch', async () => {
            await expect(services.startService(options, Service.Opensearch))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });

        it('should throw error if bad options passed to startServices for elasticsearch', async () => {
            await expect(services.startService(options, Service.Elasticsearch))
                .rejects.toThrowWithMessage(TSError, /w*Unable to find image*\w/);
        });
    });
});
