import fse from 'fs-extra';
import execa from 'execa';
import path from 'node:path';
import * as config from '../config';
import { ImagesAction } from './interfaces';
import signale from '../signale';

export async function images(action: ImagesAction): Promise<void> {
    if (action === ImagesAction.List) {
        return createImageList('./images');
    }

    if (action === ImagesAction.Save) {
        return saveImages(config.DOCKER_CACHE_PATH, './images');
    }
}

/**
 * Builds a list of all docker images needed for the teraslice CI pipeline
 * @returns Record<string, string>
 */
async function createImageList(imagesPath: string): Promise<void> {
    signale.info(`Creating Docker image list at ${imagesPath}/image-list.txt`);

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
