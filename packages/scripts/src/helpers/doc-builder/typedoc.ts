import path from 'node:path';
import fse from 'fs-extra';
import { Application, TSConfigReader } from 'typedoc';
import { PackageInfo } from '../interfaces.js';
import { listMdFiles, getName, writeIfChanged } from '../misc.js';
import signale from '../signale.js';

function isOverview(filePath: string): boolean {
    return path.basename(filePath, '.md') === 'overview';
}

async function writeDocFile(
    filePath: string,
    { title, sidebarLabel }: { title: string; sidebarLabel: string }
) {
    let contents = await fse.readFile(filePath, 'utf8');
    // remove header
    contents = contents
        .split('\n')
        .slice(isOverview(filePath) ? 7 : 4)
        .join('\n')
        .trim();

    // fix path
    contents = contents
        // eslint-disable-next-line no-useless-escape
        .replace(/(\]\([\w\.\/\-]*)README\.md/g, '$1overview.md');
    // build final content
    contents = `---
title: ${title}
sidebar_label: ${sidebarLabel}
---

${contents}`;
    await writeIfChanged(filePath, contents, {
        log: false,
    });
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

async function fixDocs(outputDir: string, { displayName }: PackageInfo) {
    const overviewFilePath = listMdFiles(outputDir).find((filePath) => path.basename(filePath, '.md') === 'README');
    if (!overviewFilePath) {
        signale.error(
            'Error: Package documentation was not generated correctly'
            + ', this means the package my not work with the typedoc\'s version of TypeScript.'
        );
        return;
    }
    const targetPath = path.join(path.dirname(overviewFilePath), 'overview.md');
    await fse.rename(overviewFilePath, targetPath);
    const overview = await fse.readFile(targetPath, 'utf8');

    const promises = listMdFiles(outputDir).map(async (filePath) => {
        const fileName = path.basename(filePath, '.md');
        if (fileName === 'overview') {
            await writeDocFile(filePath, {
                title: `${displayName} API Overview`,
                sidebarLabel: 'API',
            });
            return;
        }
        const component = getAPIName(overview, outputDir, filePath);
        await writeDocFile(filePath, {
            title: `${displayName}: \`${component}\``,
            sidebarLabel: component,
        });
        if (fileName === 'README') {
            const pathOnly = path.dirname(filePath);
            await fse.rename(filePath, path.join(pathOnly, 'overview.md'));
        }
    });

    await Promise.all(promises);
}

export async function generateTSDocs(pkgInfo: PackageInfo, outputDir: string): Promise<void> {
    signale.await(`building typedocs for package ${pkgInfo.name}`);

    const cwd = process.cwd();
    try {
        process.chdir(pkgInfo.dir);
        const app = await Application.bootstrapWithPlugins(
            {
                name: pkgInfo.name,
                tsconfig: path.join(pkgInfo.dir, 'tsconfig.json'),
                plugin: ['typedoc-plugin-markdown'],
                entryPoints: ['./src'],
                entryPointStrategy: 'expand',
                router: 'member',
                exclude: ['test', 'node_modules'],
                excludePrivate: 'true',
                excludeExternals: 'true',
                hideGenerator: 'true',
                logLevel: 1,
                readme: 'none',
                outputs: [
                    {
                        // requires typedoc-plugin-markdown
                        name: 'markdown',
                        path: outputDir
                    }
                ]
            },
            [new TSConfigReader()]
        );

        // typedoc-plugin-markdown specific options
        app.options.setValue('membersWithOwnFile', ['Class', 'Enum', 'Interface']);
        app.options.setValue('useHTMLAnchors', true);
        app.options.setValue('sanitizeComments', true);
        app.options.setValue('indexFormat', 'table');
        app.options.setValue('parametersFormat', 'table');
        app.options.setValue('enumMembersFormat', 'table');
        app.options.setValue('interfacePropertiesFormat', 'table');
        app.options.setValue('classPropertiesFormat', 'table');
        app.options.setValue('propertyMembersFormat', 'table');

        if (app.logger.hasErrors()) {
            signale.error(`found errors typedocs for package ${pkgInfo.name}`);
            return;
        }
        const project = await app.convert();
        if (!project) {
            signale.error(`invalid typedocs for package ${pkgInfo.name}`);
            return;
        }

        if (fse.existsSync(outputDir)) {
            await fse.emptyDir(outputDir);
        }
        await fse.ensureDir(outputDir);

        await app.generateOutputs(project);

        if (app.logger.hasErrors()) {
            signale.error(`found errors when generating typedocs for package ${pkgInfo.name}`);
            return;
        }

        await fixDocs(outputDir, pkgInfo);

        signale.success(`generated docs for package ${pkgInfo.name}`);
    } finally {
        process.chdir(cwd);
    }
}
