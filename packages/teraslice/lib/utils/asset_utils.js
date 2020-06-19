'use strict';

const { isInteger } = require('@terascope/utils');
const semver = require('semver');

function findMatchingAsset(records, name, version) {
    const range = toSemverRange(version);
    const assets = records
        .filter(_isCompatibleAsset(name, range))
        .sort((a, b) => semver.rcompare(a.version, b.version));

    return assets.find((asset) => asset.name);
}

function getMajorVersion(version) {
    if (version == null) return version;
    if (isInteger(version)) return version;
    return semver.major(version);
}

const nodeVersion = getMajorVersion(process.version);
/**
 * This just compares the major version
*/
function isCompatibleNodeVersion(version) {
    if (version == null) return true;
    return getMajorVersion(version) === nodeVersion;
}

function _isCompatibleAsset(name, range) {
    return (record) => {
        if (record.name !== name) return false;
        if (!isCompatibleNodeVersion(record.node_version)) {
            return false;
        }
        if (record.arch != null && record.arch !== process.arch) {
            return false;
        }
        if (record.platform != null && record.platform !== process.platform) {
            return false;
        }
        if (!semver.satisfies(record.version, range)) {
            return false;
        }
        return true;
    };
}

function toSemverRange(version) {
    if (!version || version === 'latest') return '*';
    if (semver.validRange(version)) {
        return version;
    }

    throw new Error(`Version "${version}" is not a valid semver range`);
}

module.exports = {
    getMajorVersion,
    findMatchingAsset,
    toSemverRange,
};
