import got from 'got';
import signale from './signale.js';
// @ts-expect-error: truncate exists in semver@7.8.2 but is missing from @types/semver@7.7.1
import { truncate } from 'semver';

const token = process.env['GITHUB_TOKEN'];

/**
 * Fetches the latest Teraslice GitHub release and extracts the GHCR image tag
 * for the current Node.js major version from the release body.
 */
export async function getLatestTerasliceImageTag(): Promise<string> {
    const nodeMajor = process.version.slice(1).split('.')[0];
    signale.pending(`Fetching latest Teraslice image tag for Node ${nodeMajor} from GHCR...`);
    signale.info(token ? 'Authenticated with github API' : 'Not authenticated with github API');

    const releasesResponse = await got('https://api.github.com/repos/terascope/teraslice/releases?per_page=1', {
        // Use a github token if available
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const releases = JSON.parse(releasesResponse.body) as { tag_name: string; body: string }[];
    const latest = releases[0];

    if (!latest) {
        throw new Error('Unable to determine latest Teraslice release from GitHub');
    }

    const imagePrefix = 'ghcr.io/terascope/teraslice:';
    const match = latest.body
        .split('\n')
        .map((line) => line.match(new RegExp(`${imagePrefix}(v[^\\s\`]+nodev${nodeMajor}[^\\s\`]*)`))?.[1])
        .find(Boolean);

    if (!match) {
        throw new Error(`No Teraslice image found in release ${latest.tag_name} for Node ${nodeMajor}`);
    }

    signale.success(`Latest Teraslice image tag: ${match}`);
    return match;
}

export async function getKindDockerImage(kindVersion: string, k8sVersion: string): Promise<string> {
    const k8sVersionFormatted = k8sVersion.startsWith('v') ? k8sVersion : `v${k8sVersion}`;

    signale.pending(`Fetching kindest_node image tag for Kind ${kindVersion} with Kubernetes ${k8sVersionFormatted}...`);
    signale.info(token ? 'Authenticated with github API' : 'Not authenticated with github API');
    const msgPrefix = 'Failed to get Kind docker image:';

    let releaseResponse: { body?: string };
    try {
        releaseResponse = await got(`https://api.github.com/repos/kubernetes-sigs/kind/releases/tags/${kindVersion}`, {
            // Use a github token if available
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).json();
    } catch (err) {
        throw new Error(`${msgPrefix} Failed to retrieve Kind ${kindVersion} release information: ${err.message}`);
    }

    if (releaseResponse.body) {
        const lines = releaseResponse.body.split('\r\n');
        // We assume all release notes will have this line before the image list
        const imageListIndex = lines.indexOf('Images pre-built for this release:');
        if (imageListIndex !== -1) {
            let idx = imageListIndex + 1;
            let imageLine = lines[idx];
            const versionsFound = [];
            // We assume imageLine has this format '- v1.36.1: `kindest/node:v1.36.1@sha256:...`'
            while (imageLine.startsWith('- v') || imageLine.startsWith('* v')) {
                const lineSections = imageLine.split(' ');
                const lineVersion = lineSections[1].slice(0, -1);
                versionsFound.push(lineVersion);
                const tag = lineSections[2].slice(1, -1); // remove backticks
                if (lineVersion === k8sVersionFormatted) {
                    signale.success(`Retrieved kindest_node image tag for Kind ${kindVersion} with Kubernetes ${k8sVersionFormatted}.`);
                    return tag;
                } else if (truncate(lineVersion, 'minor') === truncate(k8sVersionFormatted, 'minor')) {
                    signale.warn(`There is no prebuilt image for Kind ${kindVersion} with Kubernetes ${k8sVersionFormatted}. `
                        + `Using closest patch version: ${lineVersion}. If this is unacceptable install a Kind version that supports ${k8sVersionFormatted}. `
                        + `See https://github.com/kubernetes-sigs/kind/releases`
                    );
                    return tag;
                }
                imageLine = lines[++idx];
            }
            throw new Error(
                `${msgPrefix} Kind ${kindVersion} has no pre-built images for kubernetes minor version ${truncate(k8sVersionFormatted, 'minor')!.slice(0, -2)}. `
                + `See https://github.com/kubernetes-sigs/kind/releases to find a Kind version that supports ${k8sVersionFormatted} `
                + `or set env var 'K8S_VERSION' to one of the following kubernetes versions: ${versionsFound}`
            );
        }
    }
    throw new Error(`${msgPrefix} Could not parse github API release body for Kind ${kindVersion}`);
}
