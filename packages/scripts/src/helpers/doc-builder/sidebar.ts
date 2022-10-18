import path from 'path';
import fse from 'fs-extra';
import { getRootDir, listMdFiles, writeIfChanged } from '../misc.js';
import { PackageInfo } from '../interfaces.js';
import { getWorkspaceNames } from '../packages.js';

function getSubcategories(pkgDocFolder: string): string[] {
    const docsFolder = path.join(getRootDir(), 'docs');
    return listMdFiles(pkgDocFolder, 2)
        .map((filePath) => {
            const relativePath = path.relative(docsFolder, filePath).replace(/^[./]/, '');
            return path.join(path.dirname(relativePath), path.basename(relativePath, '.md'));
        })
        .sort((a, b) => a.length - b.length);
}

export async function updateSidebarJSON(pkgInfos: PackageInfo[], log?: boolean) {
    const sidebarFilePath = path.join(getRootDir(), 'website/sidebars.json');
    const sidebarJSON = await fse.readJSON(sidebarFilePath);

    for (const name of getWorkspaceNames()) {
        const docsFilePath = path.join(getRootDir(), 'docs', name);

        if (!sidebarJSON[name]) {
            sidebarJSON[name] = {
                Overview: [name],
                Packages: [],
            };
        }

        const pkgMap: Record<string, boolean> = {};
        pkgInfos.forEach((pkgInfo) => {
            if (!pkgInfo.dir.includes(`/${name}/`)) return;
            pkgMap[pkgInfo.folderName] = false;
        });

        const processList = (list: (Subcategory|string|undefined)[], addMissing: boolean) => {
            const existing = list.map((pkg): Subcategory|undefined => {
                if (typeof pkg === 'string') {
                    pkgMap[pkg] = true;
                    return {
                        type: 'subcategory',
                        label: pkg,
                        ids: [`${name}/${pkg}/overview`],
                    };
                } if (pkg?.type === 'subcategory') {
                    pkgMap[pkg.label] = true;
                    return pkg;
                }
                throw new Error(`Unknown pkg, ${pkg}`);
            });

            const missing = addMissing ? Object.entries(pkgMap)
                .filter(([, exists]) => !exists)
                .map(([label]): Subcategory => ({
                    type: 'subcategory',
                    label,
                    ids: [`${name}/${label}/overview`],
                })) : [];

            return existing
                .concat(missing)
                .map((pkg): Subcategory|undefined => {
                    if (!pkg) return;

                    const filePath = path.join(docsFilePath, pkg.label);
                    const hasDocs = fse.existsSync(filePath);
                    if (!hasDocs) return;

                    return { ...pkg, ids: getSubcategories(filePath) };
                })
                .filter(Boolean) as Subcategory[];
        };

        const extraCategories = Object.keys(sidebarJSON[name])
            .filter((key) => key !== 'Overview' && key !== 'Packages');
        for (const extraCategory of extraCategories) {
            sidebarJSON[name][extraCategory] = processList(sidebarJSON[name][extraCategory], false);
        }
        sidebarJSON[name].Packages = processList(sidebarJSON[name].Packages, true);
    }

    const names = pkgInfos.map(({ name }) => name);
    for (const key of Object.keys(sidebarJSON)) {
        if (names.includes(key)) {
            delete sidebarJSON[key];
        }
    }

    await writeIfChanged(sidebarFilePath, sidebarJSON, { log });
}

type Subcategory = {
    type: 'subcategory';
    label: string;
    ids: string[];
};
