import {
    isInteger, trimStart, trim,
    getFirst, joinList
} from '@terascope/core-utils';
import { AssetRecord } from '@terascope/types';
import * as semver from 'semver';

export function findMatchingAsset(
    records: AssetRecord[],
    name: string,
    version: string
): AssetRecord | undefined {
    const range = toSemverRange(version);
    const assets = records
        .filter(_isCompatibleAsset(name, range, false))
        .sort((a, b) => semver.rcompare(a.version, b.version));

    return getFirst(assets);
}

export function findSimilarAssets(
    records: AssetRecord[],
    name: string,
    version: string
): AssetRecord[] {
    const range = toSemverRange(version);
    const assets = records
        .filter(_isCompatibleAsset(name, range, true))
        .sort((a, b) => semver.rcompare(a.version, b.version));

    return assets;
}

export function getInCompatibilityReason(assets?: AssetRecord[], prefix?: string): string {
    if (!assets || !assets.length) return '';

    const reasons: string[] = [];

    assets.slice(0, 3).forEach((asset) => {
        if (!isCompatibleNodeVersion(asset.node_version)) {
            reasons.push('node_version');
        }
        if (asset.platform != null && asset.platform !== process.platform) {
            reasons.push('platform');
        }
        if (asset.arch != null && asset.arch !== process.arch) {
            reasons.push('arch');
        }
    });

    if (!reasons.length) return '';

    return `${prefix ? `${trim(prefix)} ` : ''}${joinList(reasons, ',', 'or')} mismatch`;
}

export function getMajorVersion(version: string | number): number {
    if (version == null) return version;
    if (isInteger(version)) return version;
    return semver.major(version);
}

const SYSTEM_NODE_VERSION = getMajorVersion(process.version);
/**
 * This just compares the major version
*/
function isCompatibleNodeVersion(version: string | number | undefined) {
    if (version == null) return true;

    // anything less than or equal to current node version
    return getMajorVersion(version) <= SYSTEM_NODE_VERSION;
}

function _isCompatibleAsset(name: string, range: string, skipRestrictions = false) {
    return function checkIfCompatibleAsset(record: AssetRecord): boolean {
        if (record.name !== name) return false;
        if (!semver.satisfies(record.version, range)) {
            return false;
        }
        if (skipRestrictions) return true;

        if (!isCompatibleNodeVersion(record.node_version)) {
            return false;
        }
        if (record.arch != null && record.arch !== process.arch) {
            return false;
        }
        if (record.platform != null && record.platform !== process.platform) {
            return false;
        }
        return true;
    };
}

export function toSemverRange(version?: string | null): string {
    if (!version || version === 'latest') return '*';
    if (semver.validRange(version)) {
        return trimStart(trim(version), 'v');
    }

    throw new Error(`Version "${version}" is not a valid semver range`);
}

export function toVersionQuery(_version?: string | null): string {
    const version = trimStart(trim(_version));

    if (!version || version === 'latest' || version === '*') {
        return 'version:*';
    }

    // if there a number and * next to each other that is not valid
    // so lets just return the query: 12.34*.55
    if (/\d\*/.test(version)) return `version:${version}`;

    const range = new semver.Range(version);
    return `version:${range.range.split(' ').join(' AND version:')}`;
}
