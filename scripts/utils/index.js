'use strict';

const path = require('path');
const fs = require('fs');

function listPackages() {
    const packagesPath = path.join(process.cwd(), 'packages');
    const packages = fs.readdirSync(packagesPath).filter((pkgName) => {
        const pkgDir = path.join(packagesPath, pkgName);

        if (!fs.statSync(pkgDir).isDirectory()) return false;
        return fs.existsSync(path.join(pkgDir, 'package.json'));
    });
}

module.exports = {
    listPackages
};
