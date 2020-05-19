import path from 'path';
import fse from 'fs-extra';
import { getRootDir, listMdFiles, writeIfChanged } from '../misc';
import { PackageInfo } from '../interfaces';
import { getWorkspaceNames } from '../packages';

function getSubcategories(pkgDocFolder: string): string[] {
    const docsFolder = path.join(getRootDir(), 'docs');
    return listMdFiles(pkgDocFolder, 2)
        .map((filePath) => {
            const relativePath = path.relative(docsFolder, filePath).replace(/^[./]/, '');
            return path.join(path.dirname(relativePath), path.basename(relativePath, '.md'));
        })
        .sort((a, b) => {
            return a.length - b.length;
        });
}

export async function updateSidebarJSON(pkgInfos: PackageInfo[]) {
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

        for (const [key, list] of Object.entries(sidebarJSON.packages)) {
            if (key === 'Overview' || !Array.isArray(list)) continue;
            sidebarJSON[name][key] = list
                .map(
                    (pkg: Subcategory | string): Subcategory => {
                        if (typeof pkg === 'string') {
                            return {
                                type: 'subcategory',
                                label: pkg,
                                ids: [`${name}/${pkg}/overview`],
                            };
                        }
                        return pkg;
                    }
                )
                .filter((pkg) => {
                    if (!pkg) return false;
                    const filePath = path.join(docsFilePath, pkg.label);
                    return fse.existsSync(filePath);
                })
                .map((pkg) => {
                    pkg.ids = getSubcategories(path.join(docsFilePath, pkg.label));
                    return pkg;
                });
        }
    }

    const names = pkgInfos.map(({ name }) => name);
    for (const key of Object.keys(sidebarJSON)) {
        if (names.includes(key)) {
            delete sidebarJSON[key];
        }
    }

    await writeIfChanged(sidebarFilePath, sidebarJSON);
}

type Subcategory = {
    type: 'subcategory';
    label: string;
    ids: string[];
};
