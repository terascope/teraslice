import 'jest-extended';
import { jest } from '@jest/globals';
import fs from 'node:fs';
import { createImageList, saveImages } from '../src/helpers/images/index.js';
import * as scripts from '../src/helpers/scripts.js';
import * as config from '../src/helpers/config.js';

describe('images', () => {
    afterEach(() => {
        if (fs.existsSync(config.DOCKER_IMAGES_PATH)) {
            fs.rmSync(config.DOCKER_IMAGES_PATH, { recursive: true, force: true });
        }
    });

    describe('list', () => {
        it('should create a txt file containing a list of images for teraslice testing', async () => {
            await createImageList();
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
    });

    /*
        @TODO modules are readonly in esm, its bad to mock this way,
        should either mock the http response or refactor the code
        to make it easier to mock
    */
    xdescribe('save', () => {
        beforeAll(() => {
            const dockerPullMock = jest.spyOn(scripts, 'dockerPull');
            const saveAndZipMock = jest.spyOn(scripts, 'saveAndZip');

            dockerPullMock.mockImplementation(async () => {});
            saveAndZipMock.mockImplementation(async () => {});
        });

        it('should call dockerPull and saveAndZip for all images from DOCKER_IMAGE_LIST_PATH', async () => {
            await createImageList();
            await saveImages();

            expect(fs.existsSync(config.DOCKER_CACHE_PATH)).toBe(true);
            expect(scripts.dockerPull).toHaveBeenCalledTimes(11);
            expect(scripts.saveAndZip).toHaveBeenCalledTimes(11);
        });
    });
});
