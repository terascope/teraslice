import fse from 'fs-extra';
import execa from 'execa';
import path from 'node:path';
import * as config from '../config';
import { ImagesAction } from './interfaces';
import { getRootDir } from '../misc';

export async function images(action: ImagesAction,
    directory: string,
    script: string
): Promise<void> {
    if (action === ImagesAction.List) {
        return createImageList('./images');
    }

    if (action === ImagesAction.Load) {
        return loadImagesFromCache('/tmp/docker_cache/', directory, script);
    }

    if (action === ImagesAction.Save) {
        return saveImages('/tmp/docker_cache/', './images');
    }
}

/**
 * Builds a list of all docker images needed for the teraslice CI pipeline
 * @returns Record<string, string>
 */
async function createImageList(imagesPath: string): Promise<void> {
    const list = 'terascope/node-base:18.19.1\n'
               + 'terascope/node-base:20.11.1\n'
               + 'terascope/node-base:22.2.0\n'
               + `${config.ELASTICSEARCH_DOCKER_IMAGE}:6.8.6\n`
               + `${config.ELASTICSEARCH_DOCKER_IMAGE}:7.9.3\n`
               + `${config.OPENSEARCH_DOCKER_IMAGE}:1.3.10\n`
               + `${config.OPENSEARCH_DOCKER_IMAGE}:2.8.0\n`
               + `${config.KAFKA_DOCKER_IMAGE}:7.1.9\n`
               + `${config.ZOOKEEPER_DOCKER_IMAGE}:7.1.9\n`
               + `${config.MINIO_DOCKER_IMAGE}:RELEASE.2020-02-07T23-28-16Z\n`
               + 'kindest/node:v1.30.0';
    if (!fse.existsSync(imagesPath)) {
        await fse.emptyDir(imagesPath);
    }
    fse.writeFileSync(path.join(imagesPath, 'image-list.txt'), list);
}

/**
 * Parses a test script to determine which docker images it will require
 * @param {string} script The test script from a package.json
 * @param {Record<string, string>} list Object with keywords as keys and image tags as values
 * @returns {string[]} An arrray of image tags
 */
function parseTestScript(script: string, list: Record<string, string>): string[] {
    const imagesList: string[] = [];

    script.split(' ').forEach((part, scriptIdx, scriptArr) => {
        if (part === 'TEST_KAFKA=\'true\'') {
            imagesList.push(list.kafka);
            imagesList.push(list.zookeeper);
        }
        if (part === 'TEST_MINIO=\'true\'') {
            imagesList.push(list.minio);
        }
        if (part === 'TEST_OPENSEARCH=\'true\'') {
            if (scriptArr[scriptIdx + 1].startsWith('OPENSEARCH_VERSION=\'2')) {
                imagesList.push(list.opensearch2);
            } else {
                imagesList.push(list.opensearch1);
            }
        }
        if (part === 'TEST_ELASTICSEARCH=\'true\'') {
            if (scriptArr[scriptIdx + 1].startsWith('ELASTICSEARCH_VERSION=\'7')) {
                imagesList.push(list.elasticsearch7);
            } else {
                imagesList.push(list.elasticsearch6);
            }
        }
    });
    return imagesList;
}

/**
 * Load the docker images required by a script from the cache specified
 * @param {string} cachePath Path to a cache of docker images in tar.gz format
 * @param {string} directory Directory where the package.json to search lives
 * @param {string} script Test script from Github actions workflow
 */
async function loadImagesFromCache(
    cachePath: string,
    directory: string,
    script: string
): Promise<void> {
    const list = {
        '18.19.1': 'terascope/node-base:18.19.1',
        '20.11.1': 'terascope/node-base:20.11.1',
        '22.2.0': 'terascope/node-base:22.2.0',
        elasticsearch6: `${config.ELASTICSEARCH_DOCKER_IMAGE}:6.8.6`,
        elasticsearch7: `${config.ELASTICSEARCH_DOCKER_IMAGE}:7.9.3`,
        opensearch1: `${config.OPENSEARCH_DOCKER_IMAGE}:1.3.10`,
        opensearch2: `${config.OPENSEARCH_DOCKER_IMAGE}:2.8.0`,
        kafka: `${config.KAFKA_DOCKER_IMAGE}:7.1.9`,
        zookeeper: `${config.ZOOKEEPER_DOCKER_IMAGE}:7.1.9`,
        minio: `${config.MINIO_DOCKER_IMAGE}:RELEASE.2020-02-07T23-28-16Z`,
        kind: 'kindest/node:v1.30.0'
    };

    const directoryPackageInfo = fse.readJSONSync(path.join(getRootDir(), `${directory}`, 'package.json'));

    try {
        const imagesList: string[] = [];

        script.split(' ').forEach((string, idx, arr) => {
            if (string.startsWith('test:')) {
                // find all images called for in the package.json script
                const scriptValue: string = directoryPackageInfo.scripts[string.trim()];
                imagesList.push(...parseTestScript(scriptValue, list));
            }
            if (string === '--node-version') {
                // load the base-docker-image with the called for node version
                if (list[arr[idx + 1]]) {
                    imagesList.push(list[arr[idx + 1]]);
                }
            }
        });

        const promiseArray = imagesList.map(async (imageName) => {
            const fileName = imageName.replace(/[/:]/g, '_');
            const filePath = path.join(cachePath, `${fileName}.tar.gz`);
            if (!fse.existsSync(filePath)) {
                throw new Error(`No file found at ${filePath}. Have you restored the cache?`);
            }
            execa.command(`gunzip -c ${filePath} | docker load`, { shell: true });
            fse.removeSync(filePath);
        });

        await Promise.all(promiseArray);
    } catch (err) {
        throw new Error(`Unable to load docker images due to error: ${err}`);
    }
}

async function saveAndZip(imageName:string, imageSavePath: string) {
    const fileName = imageName.replace(/[/:]/g, '_');
    const filePath = path.join(imageSavePath, `${fileName}.tar`);
    const command = `docker save ${imageName} | gzip > ${filePath}.gz`;
    await execa.command(command, { shell: true });
}

async function saveImages(imageSavePath: string, imageTxtPath: string): Promise<void> {
    try {
        if (fse.existsSync(imageSavePath)) {
            fse.rmSync(imageSavePath, { recursive: true, force: true });
        }
        fse.mkdirSync(imageSavePath);
        const imagesString = fse.readFileSync(path.join(imageTxtPath, 'image-list.txt'), 'utf-8');
        const imagesArray = imagesString.split('\n');
        const pullPromises = imagesArray.map(async (imageName) => {
            await execa.command(`docker pull ${imageName}`);
        });
        await Promise.all(pullPromises);

        for (let i = 0; i < imagesArray.length; i += 2) {
            if (typeof imagesArray[i + 1] === 'string') {
                await Promise.all([
                    saveAndZip(imagesArray[i], imageSavePath),
                    saveAndZip(imagesArray[i + 1], imageSavePath)
                ]);
            } else {
                await saveAndZip(imagesArray[i], imageSavePath);
            }
        }
    } catch (err) {
        throw new Error(`Unable to pull and save images due to error: ${err}`);
    }
}
