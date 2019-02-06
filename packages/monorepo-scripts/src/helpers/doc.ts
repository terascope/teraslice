import fs from 'fs';
import path from 'path';
import { firstToUpper } from '@terascope/utils';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

async function isDir(dir: string) {
    return (await stat(dir)).isDirectory();
}

async function readIndex(dir: string): Promise<Buffer|undefined> {
    const filePath = path.join(dir, 'index.md');
    if (!fs.existsSync(filePath)) return;
    return readFile(filePath);
}

function formatTitle(input: string) {
    return path.basename(input, '.md')
        .split(/[-_]/)
        .map(firstToUpper)
        .join(' ');
}

export async function getDocs(docsDir: string, _baseDir?: string): Promise<DocItem> {
    if (!(await isDir(docsDir))) throw new Error('Input must be a directory');
    const baseDir = _baseDir || docsDir;

    const doc: DocItem = {
        title: formatTitle(docsDir),
        path: path.relative(baseDir, docsDir),
        body: await readIndex(docsDir),
        children: [],
        docs: []
    };

    const result = await readdir(docsDir);

    const promises = result.map(async (file) => {
        const fullPath = path.join(docsDir, file);
        if (await isDir(fullPath)) {
            doc.children.push(await getDocs(fullPath, baseDir));
            return;
        }

        if (file === 'index.md' || !file.endsWith('.md')) {
            return;
        }

        doc.docs.push({
            title: formatTitle(file),
            path: path.relative(baseDir, fullPath),
            body: await readFile(fullPath),
        });

        return;
    });

    await Promise.all(promises);

    // @ts-ignore
    doc.children = doc.children.sort((a, b) => a.title - b.title);
    return doc;
}

export interface Doc {
    title: string;
    path: string;
    body?: Buffer;
}

export interface DocItem extends Doc {
    children: DocItem[];
    docs: Doc[];
}
