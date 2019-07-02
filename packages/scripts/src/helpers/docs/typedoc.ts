import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { Application } from 'typedoc';
import { PackageInfo } from '../interfaces';

function getName(input: string): string {
    return _.words(input)
        .map((str: string) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`)
        .join(' ');
}

function listMdFiles(dir: string): string[] {
    const files: string[] = [];
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

async function writeDocFile(filePath: string, { title, sidebarLabel }: { title: string; sidebarLabel: string }) {
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

function getAPIName(overview: string, outputDir: string, filePath: string) {
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

async function fixDocs(outputDir: string, { folderName }: PackageInfo) {
    const pkgName = getName(folderName);

    const overviewFilePath = listMdFiles(outputDir).find(filePath => path.basename(filePath, '.md') === 'README');
    if (!overviewFilePath) {
        throw new Error('Package documentation was not generated correctly, missing README.md');
    }
    const targetPath = path.join(path.dirname(overviewFilePath), 'overview.md');
    await fse.rename(overviewFilePath, targetPath);
    const overview = await fse.readFile(targetPath, 'utf8');

    const promises = listMdFiles(outputDir).map(async filePath => {
        const fileName = path.basename(filePath, '.md');
        if (fileName === 'overview') {
            await writeDocFile(filePath, {
                title: `${pkgName} API Overview`,
                sidebarLabel: 'API',
            });
            return;
        }
        const component = getAPIName(overview, outputDir, filePath);
        await writeDocFile(filePath, {
            title: `${pkgName} :: ${component}`,
            sidebarLabel: component,
        });
    });

    await Promise.all(promises);
}

export async function generateTSDocs(pkgInfo: PackageInfo, outputDir: string) {
    // tslint:disable-next-line: no-console
    console.log(`* building typedocs for package ${pkgInfo.name}`);
    const cwd = process.cwd();
    try {
        process.chdir(pkgInfo.dir);
        const app = new Application({
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
            readme: 'none',
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
        await execa('yarn', ['run', 'build'], {
            cwd: pkgInfo.dir,
        });
    } finally {
        process.chdir(cwd);
    }
}

export function isTSDocCompatible({ isTypescript, folderName }: PackageInfo) {
    return isTypescript && !folderName.startsWith('ui-') && !folderName.startsWith('data-access') && folderName !== 'scripts';
}
