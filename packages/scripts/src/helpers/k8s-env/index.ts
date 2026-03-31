import path from 'node:path';
import fs from 'node:fs';
import { isCI, pRetry } from '@terascope/core-utils';
import {
    dockerTag, isHelmInstalled, isHelmfileInstalled, isKindInstalled,
    isKubectlInstalled, launchTerasliceWithHelmfile,
    helmfileDestroy, determineSearchHost, deletePersistentVolumeClaim,
    generateTestCaCerts, dockerBuild, getConfigValueFromCustomYaml,
    launchTerasliceWithCustomHelmfile, setConfigValuesForCustomYaml
} from '../scripts.js';
import { Kind } from '../kind.js';
import { K8sEnvOptions } from './interfaces.js';
import signale from '../signale.js';
import { getDevDockerImage, getRootDir, getRootInfo } from '../misc.js';
import { buildDevDockerImage } from '../publish/utils.js';
import { PublishOptions, PublishType } from '../publish/interfaces.js';
import config from '../config.js';
import { loadImagesForHelm, loadImagesForHelmFromConfigFile } from '../test-runner/services.js';

const rootInfo = getRootInfo();
const e2eImage = `${rootInfo.name}:e2e-nodev${config.NODE_VERSION}`;

export async function launchK8sEnv(options: K8sEnvOptions) {
    let repo: string = '';
    let tag: string = '';
    let imageName: string = '';
    let buildTerasliceImage: boolean = true;

    if (options.configFile) {
        signale.pending('Starting k8s environment with a config file..');
        // set the repo and tag to whats in th custom config to use later
        repo = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.repository');
        tag = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.tag');
        imageName = `${repo}:${tag}`;
        buildTerasliceImage = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.build');
    } else {
        signale.pending('Starting k8s environment with the following options: ', options);
    }

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

    const kubectlInstalled = await isKubectlInstalled();
    if (!kubectlInstalled) {
        signale.error('Please install kubectl before launching a k8s dev environment. https://kubernetes.io/docs/tasks/tools/');
        process.exit(1);
    }

    if (!options.configFile) {
        await generateTestCaCerts();
    }

    signale.pending('Creating kind cluster');
    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);
    try {
        await kind.createCluster(options.dev, options.configFile);
    } catch (err) {
        signale.error(err);
        // Do not destroy existing cluster if that was the cause of failure
        if (!err.message.includes('node(s) already exist for a cluster with the name')) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('Kind cluster created');

    try {
        if (!options.configFile || (buildTerasliceImage)) {
            await buildAndTagTerasliceImage(options);
        }

        if ((options.configFile && await getConfigValueFromCustomYaml(options.configFile, 'utility.enabled')) || process.env.ENABLE_UTILITY_SVC) {
            await buildUtilityImage();
        }
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }

    signale.pending('Loading service images into kind cluster');
    if (options.configFile) {
        await loadImagesForHelmFromConfigFile(options.kindClusterName, options.configFile);
    } else {
        await loadImagesForHelm(options.kindClusterName, false);
    }
    signale.success('Service images loaded into kind cluster');

    signale.pending('Loading teraslice image into kind cluster');
    try {
        if (options.configFile) {
            if (!buildTerasliceImage) {
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
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('Teraslice image loaded into kind cluster');

    try {
        signale.pending('Launching teraslice with helmfile');
        if (options.configFile) {
            await launchTerasliceWithCustomHelmfile(options.configFile, options.debug);
        } else {
            await launchTerasliceWithHelmfile(
                options.clusteringType, options.dev, options.logs, options.debug, false
            );
        }
        signale.success('Teraslice launched with helmfile');
        signale.pending('Ensuring Teraslice api is up...');
        await ensureTeraslice();
        signale.success('Teraslice api is up and running!');
    } catch (err) {
        signale.fatal('Error deploying Teraslice: ', err);
        if (!options.keepOpen) {
            signale.warn('Shutting down k8s cluster');
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success(buildNextStepsMessage(kind, options));
}

function buildNextStepsMessage(kind: Kind, options: K8sEnvOptions): string {
    const { deployedPorts } = kind;
    const tsPort = deployedPorts.teraslice;
    const { kindClusterName } = options;

    const lines: string[] = [
        'k8s environment ready.',
        'Next steps:',
        `\tAdd alias: teraslice-cli aliases add <cluster-alias> http://localhost:${tsPort}`,
        `\t\tExample: teraslice-cli aliases add cluster1 http://localhost:${tsPort}`,
        '\tLoad assets: teraslice-cli assets deploy <cluster-alias> <user/repo-name>',
        '\t\tExample: teraslice-cli assets deploy cluster1 terascope/elasticsearch-assets',
        '\tRegister a job: teraslice-cli tjm register <cluster-alias> <path/to/job/file.json>',
        '\t\tExample: teraslice-cli tjm reg cluster1 JOB.JSON',
        '\tStart a job: teraslice-cli tjm start <path/to/job/file.json>',
        '\t\tExample: teraslice-cli tjm start JOB.JSON',
        '\tDelete the kind k8s cluster: kind delete cluster --name <clusterName>',
        `\t\tExample: kind delete cluster --name ${kindClusterName}`,
        '\tSee the docs for more options: https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview',
        'Deployed service endpoints:',
        `\tTeraslice: http://localhost:${tsPort}`,
    ];

    if (deployedPorts.opensearch1 !== undefined) {
        lines.push(`\tOpenSearch 1: http://localhost:${deployedPorts.opensearch1}`);
    }
    if (deployedPorts.opensearch2 !== undefined) {
        lines.push(`\tOpenSearch 2: http://localhost:${deployedPorts.opensearch2}`);
    }
    if (deployedPorts.opensearch3 !== undefined) {
        lines.push(`\tOpenSearch 3: http://localhost:${deployedPorts.opensearch3}`);
    }
    if (deployedPorts.minioApi !== undefined) {
        lines.push(`\tMinio API: http://localhost:${deployedPorts.minioApi}`);
        lines.push(`\tMinio UI: http://localhost:${deployedPorts.minioUi}`);
    }
    if (deployedPorts.kafka !== undefined) {
        lines.push(`\tKafka Broker: localhost:${deployedPorts.kafka}`);
    }
    if (deployedPorts.kafkaUi !== undefined) {
        lines.push(`\tKafka UI: http://localhost:${deployedPorts.kafkaUi}`);
    }

    return lines.join('\n');
}

/**
 * Hits the Teraslice API endpoint until it responds with a valid response
 * containing `teraslice_version`. Retries up to 7 times with exponential backoff.
 * Throws if the endpoint never becomes healthy.
 */
async function ensureTeraslice(): Promise<void> {
    await pRetry(async () => {
        const res = await fetch(`http://localhost:${config.TERASLICE_PORT}`);

        if (!res.ok) {
            throw new Error(`Failed to hit teraslice endpoint: ${res.status}`);
        }

        const data = await res.json();

        // Checking to see if it has 'teraslice_version key which it should always have.
        if (Object.keys(data).includes('teraslice_version')) {
            return;
        } else {
            throw new Error(`Teraslice endpoint returned an object that didn't have 'teraslice_version' as a key: ${data}`);
        }
    }, { retries: 7, delay: 1000, backoff: 1.5, maxDelay: 12000 });
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
    try {
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
    } catch (err) {
        signale.error(err);
        process.exit(1);
    }
    signale.success('Teraslice Docker image loaded');

    try {
        signale.pending('Launching rebuilt teraslice with helmfile');
        if (options.configFile) {
            await launchTerasliceWithCustomHelmfile(options.configFile, options.debug);
        } else {
            await launchTerasliceWithHelmfile(
                options.clusteringType, options.dev, options.logs, options.debug, false
            );
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

export function generateTemplateConfig() {
    const e2eHelmfileValuesPath = path.join(getRootDir(), 'packages/scripts/helm/values.yaml');
    const newFilePath = path.join(getRootDir(), 'k8s-config.yaml');

    if (fs.existsSync(newFilePath)) {
        throw new Error(`A config file has already exists at ${newFilePath}. Either delete it or rename it to generate a new config.`);
    }

    const file = fs.readFileSync(e2eHelmfileValuesPath, 'utf-8');
    fs.writeFileSync(newFilePath, file);
    signale.success(`Generated new templated config file at ${newFilePath}`);
}
