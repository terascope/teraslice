import fse from 'fs-extra';
import * as config from '../config';
import { ImagesAction } from './interfaces';
import signale from '../signale';
import { dockerPull, saveAndZip } from '../scripts';

export async function images(action: ImagesAction): Promise<void> {
    if (action === ImagesAction.List) {
        return createImageList();
    }

    if (action === ImagesAction.Save) {
        return saveImages();
    }
}

/**
 * Builds a list of all docker images needed for the teraslice CI pipeline
 * @returns Promise<void>
 */
export async function createImageList(): Promise<void> {
    signale.info(`Creating Docker image list at ${config.DOCKER_IMAGE_LIST_PATH}`);

    const baseImages: string = config.TEST_NODE_VERSIONS
        .reduce((acc: string, version: string) => `${acc}${config.BASE_DOCKER_IMAGE}:${version}\n`, '');

    const list = `${baseImages}`
               + `${config.ELASTICSEARCH_DOCKER_IMAGE}:${config.ELASTICSEARCH6_VERSION}\n`
               + `${config.ELASTICSEARCH_DOCKER_IMAGE}:${config.ELASTICSEARCH7_VERSION}\n`
               + `${config.OPENSEARCH_DOCKER_IMAGE}:${config.OPENSEARCH1_VERSION}\n`
               + `${config.OPENSEARCH_DOCKER_IMAGE}:${config.OPENSEARCH2_VERSION}\n`
               + `${config.KAFKA_DOCKER_IMAGE}:${config.KAFKA_IMAGE_VERSION}\n`
               + `${config.ZOOKEEPER_DOCKER_IMAGE}:${config.KAFKA_IMAGE_VERSION}\n`
               + `${config.MINIO_DOCKER_IMAGE}:${config.MINIO_VERSION}\n`
               + `${config.KIND_DOCKER_IMAGE}:${config.KIND_VERSION}`;

    if (!fse.existsSync(config.DOCKER_IMAGES_PATH)) {
        await fse.emptyDir(config.DOCKER_IMAGES_PATH);
    }
    fse.writeFileSync(config.DOCKER_IMAGE_LIST_PATH, list);
}

/**
 * Pulls all docker images from the list at config.DOCKER_IMAGE_LIST_PATH
 * then saves and zips them to config.DOCKER_CACHE_PATH in batches of 2.
 * @returns Promise<void>
 */
export async function saveImages(): Promise<void> {
    try {
        if (fse.existsSync(config.DOCKER_CACHE_PATH)) {
            fse.rmSync(config.DOCKER_CACHE_PATH, { recursive: true, force: true });
        }
        fse.mkdirSync(config.DOCKER_CACHE_PATH);
        const imagesString = fse.readFileSync(config.DOCKER_IMAGE_LIST_PATH, 'utf-8');
        const imagesArray = imagesString.split('\n');
        const pullPromises = imagesArray.map(async (imageName) => {
            signale.info(`Pulling Docker image: ${imageName}`);
            await dockerPull(imageName);
        });
        await Promise.all(pullPromises);

        for (let i = 0; i < imagesArray.length; i += 2) {
            if (typeof imagesArray[i + 1] === 'string') {
                await Promise.all([
                    saveAndZip(imagesArray[i], config.DOCKER_CACHE_PATH),
                    saveAndZip(imagesArray[i + 1], config.DOCKER_CACHE_PATH)
                ]);
            } else {
                await saveAndZip(imagesArray[i], config.DOCKER_CACHE_PATH);
            }
        }
    } catch (err) {
        throw new Error(`Unable to pull and save images due to error: ${err}`);
    }
}
