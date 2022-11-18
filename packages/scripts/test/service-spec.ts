import 'jest-extended';
import { TSError } from '@terascope/utils';
import * as services from '../src/helpers/test-runner/services';

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
