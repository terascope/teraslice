'use strict';

const {
    isInteger, trimStart, trim, getFirst, joinList
} = require('@terascope/utils');
const semver = require('semver');

function findMatchingAsset(records, name, version) {
    const range = toSemverRange(version);
    const assets = records
        .filter(_isCompatibleAsset(name, range, false))
        .sort((a, b) => semver.rcompare(a.version, b.version));

    return getFirst(assets);
}

function findSimilarAssets(records, name, version) {
    const range = toSemverRange(version);
    const assets = records
        .filter(_isCompatibleAsset(name, range, true))
        .sort((a, b) => semver.rcompare(a.version, b.version));

    return assets;
}

function getInCompatibilityReason(assets, prefix) {
    if (!assets || !assets.length) return '';

    const reasons = [];

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

function getMajorVersion(version) {
    if (version == null) return version;
    if (isInteger(version)) return version;
    return semver.major(version);
}

const SYSTEM_NODE_VERSION = getMajorVersion(process.version);
/**
 * This just compares the major version
*/
function isCompatibleNodeVersion(version) {
    if (version == null) return true;

    // anything less than or equal to current node version
    return getMajorVersion(version) <= SYSTEM_NODE_VERSION;
}

function _isCompatibleAsset(name, range, skipRestrictions = false) {
    return (record) => {
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

function toSemverRange(version) {
    if (!version || version === 'latest') return '*';
    if (semver.validRange(version)) {
        return trimStart(trim(version), 'v');
    }

    throw new Error(`Version "${version}" is not a valid semver range`);
}

function toVersionQuery(_version) {
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

module.exports = {
    findSimilarAssets,
    getInCompatibilityReason,
    getMajorVersion,
    findMatchingAsset,
    toSemverRange,
    toVersionQuery,
};
