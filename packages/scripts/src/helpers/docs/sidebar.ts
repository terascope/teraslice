import path from 'path';
import fse from 'fs-extra';
import { listMdFiles } from './misc';
import { getRootDir } from '../packages';

function getSubcategories(pkgDocFolder: string): string[] {
    const docsFolder = path.join(getRootDir(), 'docs');
    return listMdFiles(pkgDocFolder, 2)
        .map(filePath => {
            const relativePath = path.relative(docsFolder, filePath).replace(/^[./]/, '');
            return path.join(path.dirname(relativePath), path.basename(relativePath, '.md'));
        })
        .sort((a, b) => {
            return a.length - b.length;
        });
}

export async function updateSidebarJSON() {
    const docsFilePath = path.join(getRootDir(), 'docs/packages');
    const sidebarFilePath = path.join(getRootDir(), 'website/sidebars.json');
    const sidebarJSON = await fse.readJSON(sidebarFilePath);
    if (!sidebarJSON.packages) {
        sidebarJSON.packages = {
            Overview: ['packages'],
            Packages: [],
        };
    }
    for (const [key, list] of Object.entries(sidebarJSON.packages)) {
        if (key === 'Overview' || !Array.isArray(list)) continue;
        sidebarJSON.packages[key] = list
            .map(
                (pkg: Subcategory | string): Subcategory => {
                    if (typeof pkg === 'string') {
                        return {
                            type: 'subcategory',
                            label: pkg,
                            ids: [`packages/${pkg}/overview`],
                        };
                    }
                    return pkg;
                }
            )
            .filter(pkg => {
                if (!pkg) return false;
                const filePath = path.join(docsFilePath, pkg.label);
                return fse.existsSync(filePath);
            })
            .map(pkg => {
                pkg.ids = getSubcategories(path.join(docsFilePath, pkg.label));
                return pkg;
            });
    }

    // tslint:disable-next-line: no-console
    console.log('* updating website/sidebars.json');
    await fse.writeJSON(sidebarFilePath, sidebarJSON, {
        spaces: 4,
    });
}

type Subcategory = {
    type: 'subcategory';
    label: string;
    ids: string[];
};
