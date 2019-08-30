import path from 'path';
import fse from 'fs-extra';
import { PackageInfo, TestSuite } from '../interfaces';
import { getRootDir, writeIfChanged, getRootInfo } from '../misc';
import { getDocPath } from '../packages';

export async function generateReadme(pkgInfo: PackageInfo): Promise<string> {
    const rootInfo = getRootInfo();

    const docsPath = getDocPath(pkgInfo, true, false);
    const issuesUrl = `${rootInfo.bugs.url}?q=is%3Aopen+is%3Aissue+label%3Apkg%2F${pkgInfo.folderName}`;

    return `<!-- THIS FILE IS AUTO-GENERATED, EDIT ${docsPath}.md -->

# ${pkgInfo.displayName}

> ${pkgInfo.description}

This a package within the [${rootInfo.displayName}](${rootInfo.homepage}) monorepo. See our [documentation](${
    rootInfo.documentation
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
    const sideBarLabel = isE2E ? pkgInfo.displayName : 'overview';
    return `---
title: ${pkgInfo.displayName}
sidebar_label: ${sideBarLabel}
---

> ${pkgInfo.description}`;
}

export async function ensureOverview(pkgInfo: PackageInfo): Promise<void> {
    const pkgDocPath = getDocPath(pkgInfo, true, true);
    if (!fse.existsSync(pkgDocPath)) {
        const contents = await generateOverview(pkgInfo);
        await writeIfChanged(pkgDocPath, contents, {
            mkdir: true,
        });
    }
}

function isE2E(pkgInfo: PackageInfo) {
    return pkgInfo.terascope.testSuite === TestSuite.E2E;
}
