import path from 'path';
import fse from 'fs-extra';
import { PackageInfo } from '../interfaces';
import { getRootDir, writeIfChanged } from '../misc';

export async function generateReadme(pkgInfo: PackageInfo): Promise<string> {
    const rootFolder = path.basename(pkgInfo.dir);
    const rootPkgJSON = await fse.readJSON(path.join(getRootDir(), 'package.json'));

    const docsPath = `docs/${rootFolder}/${pkgInfo.folderName}/overview`;
    const issuesUrl = `${rootPkgJSON.bugs.url}?q=is%3Aopen+is%3Aissue+label%3Apkg%2F${pkgInfo.folderName}`;

    return `<!-- THIS FILE IS AUTO-GENERATED, EDIT ${docsPath}.md -->

# ${pkgInfo.displayName}

> ${pkgInfo.description}

This a package within the [${rootPkgJSON.displayName}](${rootPkgJSON.homepage}) monorepo. See our [documentation](${
    rootPkgJSON.documentation
}/${docsPath}) for more information or the [issues](${issuesUrl}) associated with this package

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[${pkgInfo.license}](./LICENSE) licensed.`;
}

export async function updateReadme(pkgInfo: PackageInfo): Promise<void> {
    const readmePath = path.join(pkgInfo.dir, 'README.md');
    const contents = await generateReadme(pkgInfo);
    await writeIfChanged(readmePath, contents);
}

export async function generateOverview(pkgInfo: PackageInfo) {
    return `---
title: ${pkgInfo.displayName}
sidebar_label: Overview
---

> ${pkgInfo.description}`;
}

export async function ensureOverview(pkgInfo: PackageInfo): Promise<void> {
    const pkgDocPath = path.join(getRootDir(), 'docs/packages/', pkgInfo.folderName);
    const overviewPath = path.join(pkgDocPath, 'overview.md');
    if (!fse.existsSync(overviewPath)) {
        const contents = await generateOverview(pkgInfo);
        await writeIfChanged(overviewPath, contents, {
            mkdir: true,
        });
    }
}
