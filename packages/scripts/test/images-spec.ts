import 'jest-extended';
import fs from 'node:fs';
import { createImageList } from '../src/helpers/images/index.js';
import config from '../src/helpers/config.js';

describe('images command', () => {
    afterEach(() => {
        if (fs.existsSync(config.DOCKER_IMAGES_PATH)) {
            fs.rmSync(config.DOCKER_IMAGES_PATH, { recursive: true, force: true });
        }
    });

    describe('list docker images', () => {
        it('should create a txt file containing a list of docker images for teraslice testing', async () => {
            await createImageList();
            expect(fs.existsSync(config.DOCKER_IMAGE_LIST_PATH)).toBe(true);
            const fileContents = fs.readFileSync(config.DOCKER_IMAGE_LIST_PATH, 'utf-8');
            expect(fileContents).toBeString();
            expect(fileContents).toContain(config.OPENSEARCH_DOCKER_IMAGE);
            expect(fileContents).toContain(config.KAFKA_DOCKER_IMAGE);
            expect(fileContents).toContain(config.MINIO_DOCKER_IMAGE);
            expect(fileContents).toContain(config.KIND_DOCKER_IMAGE);
        });
    });
});
