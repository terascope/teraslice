import 'jest-extended';
import fs from 'node:fs';
import { createImageList, saveImages } from '../src/helpers/images';
import * as scripts from '../src/helpers/scripts';
import * as config from '../src/helpers/config';

describe('images', () => {
    describe('list', () => {
        it('should create a txt file containing a list of images for teraslice testing', async () => {
            await createImageList('teraslice');
            expect(fs.existsSync(config.DOCKER_IMAGE_LIST_PATH)).toBe(true);
            const fileContents = fs.readFileSync(config.DOCKER_IMAGE_LIST_PATH, 'utf-8');
            expect(fileContents).toBeString();
            expect(fileContents).toContain(config.BASE_DOCKER_IMAGE);
            expect(fileContents).toContain(config.ELASTICSEARCH_DOCKER_IMAGE);
            expect(fileContents).toContain(config.OPENSEARCH_DOCKER_IMAGE);
            expect(fileContents).toContain(config.KAFKA_DOCKER_IMAGE);
            expect(fileContents).toContain(config.ZOOKEEPER_DOCKER_IMAGE);
            expect(fileContents).toContain(config.MINIO_DOCKER_IMAGE);
            expect(fileContents).toContain(config.KIND_DOCKER_IMAGE);
        });

        it('should create a txt file containing a list of images for elasticsearch assets testing', async () => {
            await createImageList('elasticsearch');
            expect(fs.existsSync(config.DOCKER_IMAGE_LIST_PATH)).toBe(true);
            const fileContents = fs.readFileSync(config.DOCKER_IMAGE_LIST_PATH, 'utf-8');
            expect(fileContents).toBeString();
            expect(fileContents).toContain('elasticsearch');
            expect(fileContents).toContain('opensearch');
        });

        it('should create a txt file containing a list of images for kafka assets testing', async () => {
            await createImageList('kafka');
            expect(fs.existsSync(config.DOCKER_IMAGE_LIST_PATH)).toBe(true);
            const fileContents = fs.readFileSync(config.DOCKER_IMAGE_LIST_PATH, 'utf-8');
            expect(fileContents).toBeString();
            expect(fileContents).toContain('kafka');
            expect(fileContents).toContain('zookeeper');
        });

        it('should create a txt file containing a list of images for file assets testing', async () => {
            await createImageList('file');
            expect(fs.existsSync(config.DOCKER_IMAGE_LIST_PATH)).toBe(true);
            const fileContents = fs.readFileSync(config.DOCKER_IMAGE_LIST_PATH, 'utf-8');
            expect(fileContents).toBeString();
            expect(fileContents).toContain('minio');
        });
    });

    describe('save', () => {
        beforeAll(() => {
            const dockerPullMock = jest.spyOn(scripts, 'dockerPull');
            const saveAndZipMock = jest.spyOn(scripts, 'saveAndZip');
            dockerPullMock.mockImplementation(async () => {});
            saveAndZipMock.mockImplementation(async () => {});
        });

        it('should call dockerPull and saveAndZip for all images from DOCKER_IMAGE_LIST_PATH', async () => {
            await saveImages();
            expect(fs.existsSync(config.DOCKER_CACHE_PATH)).toBe(true);
            expect(scripts.dockerPull).toHaveBeenCalledTimes(11);
            expect(scripts.saveAndZip).toHaveBeenCalledTimes(11);
        });
    });
});
