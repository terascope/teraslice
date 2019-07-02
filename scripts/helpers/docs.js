/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const execa = require('execa');
const fse = require('fs-extra');
const TypeDoc = require('typedoc');

function getName(input) {
    return _.words(input)
        .map(str => `${str.charAt(0).toUpperCase()}${str.slice(1)}`)
        .join(' ');
}

function listMdFiles(dir) {
    const files = [];
    for (const fileName of fs.readdirSync(dir)) {
        const filePath = path.join(dir, fileName);
        if (fs.statSync(filePath).isDirectory()) {
            files.push(...listMdFiles(filePath));
        } else if (path.extname(fileName) === '.md') {
            files.push(filePath);
        }
    }
    return files;
}

async function writeDocFile(filePath, { title, sidebarLabel }) {
    let contents = await fse.readFile(filePath, 'utf8');
    // remove header
    contents = contents
        .split('\n')
        .slice(3)
        .join('\n')
        .trim();

    // fix paths
    contents = contents.replace(/README\.md/g, 'overview.md');
    // build final content
    contents = `---
title: ${title}
sidebar_label: ${sidebarLabel}
---

${contents}
`;
    await fse.writeFile(filePath, contents);
}

function getAPIName(overview, outputDir, filePath) {
    const relativePath = path.relative(outputDir, filePath).replace(/^[./]/, '');

    for (const line of overview.split('\n')) {
        if (line.includes(relativePath)) {
            const found = line.match(/\[[\w\s-_]+\]/g);
            if (found && found.length) {
                return found[0].replace(/[[\]]/g, '');
            }
        }
    }
    return getName(path.basename(filePath, '.md'));
}

async function fixDocs(outputDir, { folderName }) {
    const pkgName = getName(folderName);

    const overviewFilePath = listMdFiles(outputDir).find(
        filePath => path.basename(filePath, '.md') === 'README'
    );
    const targetPath = path.join(path.dirname(overviewFilePath), 'overview.md');
    await fse.rename(overviewFilePath, targetPath);
    const overview = await fse.readFile(targetPath, 'utf8');

    const promises = listMdFiles(outputDir).map(async (filePath) => {
        const fileName = path.basename(filePath, '.md');
        if (fileName === 'overview') {
            await writeDocFile(filePath, {
                title: `${pkgName} API Overview`,
                sidebarLabel: 'API'
            });
            return;
        }
        const component = getAPIName(overview, outputDir, filePath);
        await writeDocFile(filePath, {
            title: `${pkgName} :: ${component}`,
            sidebarLabel: component
        });
    });

    await Promise.all(promises);
}

async function generateTSDocs(pkgInfo, outputDir) {
    console.log(`* building typedocs for package ${pkgInfo.name}`);
    const cwd = process.cwd();
    try {
        process.chdir(pkgInfo.dir);
        const app = new TypeDoc.Application({
            name: pkgInfo.name,
            tsconfig: path.join(pkgInfo.dir, 'tsconfig.json'),
            platform: 'docusaurus',
            mode: 'file',
            theme: 'markdown',
            exclude: ['test', 'node_modules'],
            excludePrivate: true,
            excludeExternals: true,
            excludeNotExported: true,
            experimentalDecorators: true,
            jsx: true,
            moduleResolution: 'node',
            module: 'commonjs',
            hideGenerator: true,
            readme: 'none'
        });
        const inputFiles = [...app.expandInputFiles(['src'])];

        if (fse.existsSync(outputDir)) {
            await fse.emptyDir(outputDir);
        }
        await fse.ensureDir(outputDir);
        // Project may not have converted correctly
        // Rendered docs
        app.generateDocs(inputFiles, outputDir);

        await fixDocs(outputDir, pkgInfo);
        await execa('yarn', 'run build');
    } finally {
        process.chdir(cwd);
    }
}

function isTSDocCompatible({ isTypescript, folderName }) {
    return isTypescript && ['utils', 'job-components'].includes(folderName);
}

module.exports = {
    isTSDocCompatible,
    generateTSDocs
};
