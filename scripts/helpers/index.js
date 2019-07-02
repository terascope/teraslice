'use strict';

const path = require('path');
const fs = require('fs');
const execa = require('execa');
const pkgUp = require('pkg-up');

const rootDir = path.dirname(
    pkgUp.sync({
        cwd: __dirname
    })
);

async function getCommitHash() {
    const { all } = execa('git', ['rev-parse', 'HEAD'], {
        cwd: rootDir
    });
    return all;
}

function listPackages() {
    const packagesPath = path.join(rootDir, 'packages');
    return fs
        .readdirSync(packagesPath)
        .filter((fileName) => {
            const filePath = path.join(packagesPath, fileName);

            if (!fs.statSync(filePath).isDirectory()) return false;
            return fs.existsSync(path.join(filePath, 'package.json'));
        })
        .map((folderName) => {
            const dir = path.join(packagesPath, folderName);
            const pkgJSON = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
            const { name, version } = pkgJSON;
            const isTypescript = fs.existsSync(path.join(dir, 'tsconfig.json'));

            return {
                dir,
                folderName,
                name,
                version,
                pkgJSON,
                isTypescript
            };
        });
}

module.exports = {
    getCommitHash,
    listPackages,
    rootDir
};
