'use strict';

const { isInteger, trimStart, trim } = require('@terascope/utils');
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
    getMajorVersion,
    findMatchingAsset,
    toSemverRange,
    toVersionQuery,
};
