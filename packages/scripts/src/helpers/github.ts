import got from 'got';
import signale from './signale.js';

/**
 * Fetches the latest Teraslice GitHub release and extracts the GHCR image tag
 * for the current Node.js major version from the release body.
 */
export async function getLatestTerasliceImageTag(): Promise<string> {
    const nodeMajor = process.version.slice(1).split('.')[0];
    signale.pending(`Fetching latest Teraslice image tag for Node ${nodeMajor} from GHCR...`);

    const releasesResponse = await got('https://api.github.com/repos/terascope/teraslice/releases?per_page=1');
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
