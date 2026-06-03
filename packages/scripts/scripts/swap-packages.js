import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const APP_DIR = '/app/source';
const DEV_PACKAGES_ENV = process.env.TERASLICE_DEV_PACKAGES;

if (!DEV_PACKAGES_ENV) {
    console.log('TERASLICE_DEV_PACKAGES not set, nothing to swap');
    process.exit(0);
}

const devPackagePaths = DEV_PACKAGES_ENV.split(',').map((s) => s.trim()).filter(Boolean);

// Step 1: Look into each dirs package.json to find npm name
const devPackages = new Map(); // package name -> absolute host path

for (const pkgPath of devPackagePaths) {
    let packageName;
    try {
        const packageJson = JSON.parse(readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
        packageName = packageJson.name;
    } catch (err) {
        console.error(`Failed to read package.json at ${pkgPath}: ${err.message}`);
        process.exit(1);
    }
    devPackages.set(packageName, pkgPath);
    console.log(`Detected dev package: ${packageName} -> ${pkgPath}`);
}

// Step 2: Recursively find all package.json files in /app/source, skipping node_modules
// I feel going over all of /app/source and excluding node_modules is less prone to errors than
// assuming the path /app/source/packages/*/package.json
function findPackageJsonFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findPackageJsonFiles(fullPath));
        } else if (entry.name === 'package.json') {
            results.push(fullPath);
        }
    }
    return results;
}

// Step 3: If there is a match replace value with 'file:<path to mount>'
const dependencyKeys = ['dependencies', 'devDependencies', 'peerDependencies'];

// Loop through each valid package.json
for (const pkgJsonPath of findPackageJsonFiles(APP_DIR)) {
    let pkgJson;
    try {
        pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    } catch {
        // We may want to do something else if this fails but unsure.
        continue;
    }

    // Keep track if we edited a package.json file or not.
    let modified = false;

    // We want to loop through each deps key to see if we get a git on our volume dep
    for (const field of dependencyKeys) {
        if (!pkgJson[field]) continue;
        for (const [name, devPath] of devPackages) {
            if (name in pkgJson[field]) {
                console.log(`${pkgJsonPath}: ${name} ${pkgJson[field][name]} -> file:${devPath}`);
                pkgJson[field][name] = `file:${devPath}`;
                modified = true;
            }
        }
    }

    // We only want to write into a file if we modified the json object.
    if (modified) {
        writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    }
}

console.log('Completed!');
