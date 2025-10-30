import os from 'node:os';
import { execaCommandSync } from 'execa';
import path from 'node:path';
import fs from 'node:fs';
import { isCI } from '@terascope/core-utils';
import {
    dockerTag, isHelmInstalled, isHelmfileInstalled, isKindInstalled,
    isKubectlInstalled, getNodeVersionFromImage, launchTerasliceWithHelmfile,
    helmfileDestroy, determineSearchHost, deletePersistentVolumeClaim,
    generateTestCaCerts, createMinioSecret, dockerBuild, getConfigValueFromCustomYaml,
    launchTerasliceWithCustomHelmfile, setConfigValuesForCustomYaml
} from '../scripts.js';
import { Kind } from '../kind.js';
import { K8sEnvOptions } from './interfaces.js';
import signale from '../signale.js';
import { getDevDockerImage, getRootInfo } from '../misc.js';
import { buildDevDockerImage } from '../publish/utils.js';
import { PublishOptions, PublishType } from '../publish/interfaces.js';
import * as config from '../config.js';
import { K8s } from './k8s.js';
import { loadImagesForHelm, loadImagesForHelmFromConfigFile } from '../test-runner/services.js';
import { getE2EDir } from '../../helpers/packages.js';

const rootInfo = getRootInfo();
const e2eImage = `${rootInfo.name}:e2e-nodev${config.NODE_VERSION}`;

export async function launchK8sEnv(options: K8sEnvOptions) {
    let repo: string = '';
    let tag: string = '';

    if (process.env.TEST_ELASTICSEARCH && process.env.ELASTICSEARCH_VERSION?.charAt(0) === '6' && isArm()) {
        signale.error('There is no compatible Elasticsearch6 image for arm based processors. Try a different elasticsearch version.');
        process.exit(1);
    }

    if (options.configFile) {
        signale.pending('Starting k8s environment with a config file..');
        // set the repo and tag to whats in th custom config to use later
        repo = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.repository');
        tag = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.tag');
    } else {
        signale.pending('Starting k8s environment with the following options: ', options);
    }
    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);

    const kindInstalled = await isKindInstalled();
    if (!kindInstalled) {
        signale.error('Please install Kind before launching a k8s dev environment. https://kind.sigs.k8s.io/docs/user/quick-start');
        process.exit(1);
    }

    const helmfileInstalled = await isHelmfileInstalled();
    if (!helmfileInstalled && !isCI) {
        signale.error('Please install helmfile before running k8s tests. https://helmfile.readthedocs.io/en/latest/#installation');
        process.exit(1);
    }

    // TODO: Remove once all kubectl commands are converted to k8s client
    const kubectlInstalled = await isKubectlInstalled();
    if (!kubectlInstalled) {
        signale.error('Please install kubectl before launching a k8s dev environment. https://kubernetes.io/docs/tasks/tools/');
        process.exit(1);
    }

    if (!options.configFile) {
        await generateTestCaCerts();
    }

    signale.pending('Creating kind cluster');
    try {
        await kind.createCluster(options.tsPort, options.dev, options.configFile);
    } catch (err) {
        signale.error(err);
        // Do not destroy existing cluster if that was the cause of failure
        if (!err.stderr.includes('node(s) already exist for a cluster with the name')) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('Kind cluster created');

    const k8s = new K8s(options.tsPort, options.kindClusterName);
    try {
        await k8s.createNamespace('services-ns.yaml', 'services');
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }

    try {
        if (
            !options.configFile
            || (await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.build'))
        ) {
            await buildAndTagTerasliceImage(options);
            if (process.env.ENABLE_UTILITY_SVC) {
                await buildUtilityImage();
            }
        }
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }

    // If --dev is true, we must run yarn setup before creating resources
    // We need a local node_modules folder built to add it as a volume
    if (options.dev) {
        let imageVersion: string;
        try {
            if (options.configFile) {
                // Will grab the image name from the yaml config so it can validate node version
                const imageName = `${repo}:${tag}`;
                imageVersion = await getNodeVersionFromImage(imageName);
            } else {
                imageVersion = await getNodeVersionFromImage(e2eImage);
            }
        } catch (err) {
            await kind.destroyCluster();
            throw new Error(`Problem running docker command to check node version: ${err}`);
        }
        if (process.version !== imageVersion) {
            signale.fatal(`The node version this process is running on (${process.version}) does not match
            the version set in k8s-env image (${imageVersion}). Check your version by running "node -v"`);
            await kind.destroyCluster();
            process.exit(1);
        }
        signale.info(`Running yarn setup with node ${process.version}...`);
        try {
            execaCommandSync('yarn setup');
        } catch (err) {
            signale.fatal(err);
            await kind.destroyCluster();
            process.exit(1);
        }
    }

    signale.pending('Loading service images into kind cluster');
    if (options.configFile) {
        await loadImagesForHelmFromConfigFile(options.kindClusterName, options.configFile);
    } else {
        await loadImagesForHelm(options.kindClusterName, false);
    }
    signale.success('Service images loaded into kind cluster');

    signale.pending('Loading teraslice image into kind cluster');
    if (options.configFile) {
        if (!await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.build')) {
            const imageName = `${repo}:${tag}`;
            await kind.loadTerasliceImage(imageName);
        } else {
            // We need to ensure the custom config has the image we are going to use set.
            const imageArray = e2eImage.split(':');
            await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.repository', imageArray[0]);
            signale.info(`Overwrote teraslice.image.repository field in custom config to "${imageArray[0]}"`);
            await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.tag', imageArray[1]);
            signale.info(`Overwrote teraslice.image.tag field in custom config to "${imageArray[1]}"`);
            await kind.loadTerasliceImage(e2eImage);
        }
    } else {
        await kind.loadTerasliceImage(e2eImage);
    }
    signale.success('Teraslice image loaded into kind cluster');

    try {
        signale.pending('Launching teraslice with helmfile');
        // Create a minio secret if needed before helm sync
        // but after the namespaces have been made
        if (config.ENCRYPT_MINIO) {
            await createMinioSecret(k8s);
        }
        if (options.configFile) {
            await launchTerasliceWithCustomHelmfile(options.configFile);
        } else {
            await launchTerasliceWithHelmfile(options.clusteringType, options.dev);
        }
        signale.pending('Teraslice launched with helmfile');
    } catch (err) {
        signale.fatal('Error deploying Teraslice: ', err);
        if (!options.keepOpen) {
            signale.warn('Shutting down k8s cluster');
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('k8s environment ready.\nNext steps:\n\tAdd alias: teraslice-cli aliases add <cluster-alias> http://localhost:5678\n\t\tExample: teraslice-cli aliases add cluster1 http://localhost:5678\n\tLoad assets: teraslice-cli assets deploy <cluster-alias> <user/repo-name>\n\t\tExample: teraslice-cli assets deploy cluster1 terascope/elasticsearch-assets\n\tRegister a job: teraslice-cli tjm register <cluster-alias> <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm reg cluster1 JOB.JSON\n\tStart a job: teraslice-cli tjm start <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm start JOB.JSON\n\tDelete the kind k8s cluster: kind delete cluster --name <clusterName>\n\t\tExample: kind delete cluster --name k8s-env\n\tSee the docs for more options: https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview');
}

export async function rebuildTeraslice(options: K8sEnvOptions) {
    signale.time('Rebuild teraslice');

    const helmInstalled = await isHelmInstalled();
    if (!helmInstalled && !isCI) {
        signale.error('Please install Helm before running k8s tests. https://helm.sh/docs/intro/install');
        process.exit(1);
    }

    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);

    signale.pending('Deleting Teraslice deployment');
    helmfileDestroy('teraslice');
    signale.success('Teraslice deployment successfully deleted');

    if (options.resetStore) {
        try {
            const searchHost = await determineSearchHost();
            signale.pending(`Reset-store option detected - deleting the ${searchHost} service`);
            await helmfileDestroy(searchHost);
            await deletePersistentVolumeClaim(searchHost);
            signale.success(`${searchHost} service successfully deleted`);
        } catch (err) {
            signale.error(`Failed to reset store:\n${err}`);
        }
    }

    try {
        await buildAndTagTerasliceImage(options);
    } catch (err) {
        signale.error(err);
        process.exit(1);
    }

    signale.pending('Loading Teraslice Docker image');
    if (options.configFile) {
        if (await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.build') === false) {
            signale.warn(`Your teraslice configuration at "teraslice.image.build" is set to false but you passed in --rebuild. Your image configured will be replaced with the default built image.`);
        }
        // We need to ensure the custom config has the image we are going to use set.
        const imageArray = e2eImage.split(':');
        await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.repository', imageArray[0]);
        signale.info(`Overwrote teraslice.image.repository field in custom config to "${imageArray[0]}"`);
        await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.tag', imageArray[1]);
        signale.info(`Overwrote teraslice.image.tag field in custom config to "${imageArray[1]}"`);
    }
    await kind.loadTerasliceImage(e2eImage);
    signale.success('Teraslice Docker image loaded');

    try {
        signale.pending('Launching rebuilt teraslice with helmfile');
        if (options.configFile) {
            await launchTerasliceWithCustomHelmfile(options.configFile);
        } else {
            await launchTerasliceWithHelmfile(options.clusteringType, options.dev);
        }
        signale.pending('Rebuilt Teraslice launched with helmfile');
    } catch (err) {
        signale.error('Error re-deploying Teraslice: ', err);
        process.exit(1);
    }
    signale.timeEnd('Rebuild teraslice');
}

async function buildAndTagTerasliceImage(options: K8sEnvOptions) {
    let runImage;
    if (options.terasliceImage) {
        runImage = options.terasliceImage;
    } else if (options.skipBuild) {
        runImage = getDevDockerImage(config.NODE_VERSION);
    } else {
        try {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeSuffix: true,
                nodeVersion: config.NODE_VERSION,
                type: PublishType.Dev,
                dockerFileName: options.dev ? 'Dockerfile.dev' : ''
            };
            runImage = await buildDevDockerImage(publishOptions);
        } catch (err) {
            throw new Error(`Teraslice Docker image build failed: ${err}`);
        }
    }

    try {
        await dockerTag(runImage, e2eImage);
    } catch (err) {
        throw new Error(`Failed to tag teraslice docker image ${runImage} as ${e2eImage}: ${err}`);
    }
}

async function buildUtilityImage() {
    try {
        const tag = `${config.UTILITY_SVC_DOCKER_IMAGE}:${config.UTILITY_SVC_VERSION}`;
        const dockerProjectPath = config.UTILITY_SVC_DOCKER_PROJECT_PATH;
        dockerBuild(tag, undefined, undefined, undefined, undefined, dockerProjectPath);
    } catch (err) {
        throw new Error(`Utility Service Docker image build failed: ${err}`);
    }
}

function isArm() {
    return os.machine() === 'arm' || os.machine() === 'arm64' || os.machine() === 'aarch64';
}

export function generateTemplateConfig() {
    const e2eHelmfileValuesPath = path.join(getE2EDir() as string, 'helm/values.yaml');
    const newFilePath = path.join(getE2EDir() as string, '../', 'k8s-config.yaml');

    if (fs.existsSync(newFilePath)) {
        throw new Error(`A config file has already exists at ${newFilePath}. Either delete it or rename it to generate a new config.`);
    }

    const file = fs.readFileSync(e2eHelmfileValuesPath, 'utf-8');
    fs.writeFileSync(newFilePath, file);
    signale.success(`Generated new templated config file at ${newFilePath}`);
}
