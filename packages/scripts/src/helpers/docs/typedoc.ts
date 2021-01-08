import path from 'path';
import fse from 'fs-extra';
import { Application, TSConfigReader } from 'typedoc';
import {
    JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget
} from 'typescript';
import { PackageInfo } from '../interfaces';
import { listMdFiles, getName, writeIfChanged } from '../misc';
import signale from '../signale';



function isOverview(filePath: string): boolean {
    return path.basename(filePath, '.md') === 'overview';
}

async function writeDocFile(filePath: string, { title, sidebarLabel }: { title: string; sidebarLabel: string }) {
    let contents = await fse.readFile(filePath, 'utf8');
    // remove header
    contents = contents
        .split('\n')
        .slice(isOverview(filePath) ? 7 : 4)
        .join('\n')
        .trim();

    // fix paths
    contents = contents
        .replace(/(\]\([\w\.\/]*)README\.md/g, '$1overview.md');
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
            'Error: Package documentation was not generated correctly' +
            ", this means the package my not work with the typedoc's version of TypeScript."
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
    });

    await Promise.all(promises);
}



export async function generateTSDocs(pkgInfo: PackageInfo, outputDir: string): Promise<void> {
    signale.await(`building typedocs for package ${pkgInfo.name}`);

    const cwd = process.cwd();
    try {
        process.chdir(pkgInfo.dir);
        const app = new Application();
        app.options.addReader(new TSConfigReader());
        app.bootstrap({
            name: pkgInfo.name,
            tsconfig: path.join(pkgInfo.dir, 'tsconfig.json'),
            theme: 'markdown',
            exclude: ['test', 'node_modules'],
            excludePrivate: true,
            excludeExternals: true,
            hideGenerator: true,
            readme: 'none',
        });
        app.options.setValue("entryPoints", app.expandInputFiles(['src']));

        if (app.logger.hasErrors()) {
            signale.error(`found errors typedocs for package ${pkgInfo.name}`);
            return;
        }
        const project = app.convert();
        if (!project) {
            signale.error(`invalid typedocs for package ${pkgInfo.name}`);
            return;
        }

        if (fse.existsSync(outputDir)) {
            await fse.emptyDir(outputDir);
        }
        await fse.ensureDir(outputDir);

        await app.generateDocs(project, outputDir);

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
