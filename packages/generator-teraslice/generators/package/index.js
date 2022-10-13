'use strict';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yosay from 'yosay';
import { toKebabCase, trim } from '@terascope/utils';
import Generator from 'yeoman-generator';
import genPackageJSON from './utils/package-json';

export default class extends Generator {
    prompting() {
        this.log(
            yosay(`Welcome to the Teraslice ${chalk.cyan('Teraslice Package')} generator!`)
        );

        this.option('typescript');

        const appName = this.determineAppname();

        const pkgJsonPath = this.destinationPath('package.json');

        const {
            name,
            description,
            license,
            version
        } = this.fs.readJSON(pkgJsonPath, {
            name: toKebabCase(appName),
            description: 'A Teraslice package',
            license: 'MIT',
            version: '0.1.0'
        });

        const config = this.config.getAll();

        let isInternal = config.internal != null ? config.internal : false;
        if (name.includes('@terascope')) {
            isInternal = true;
        }

        const prompts = [
            {
                type: 'input',
                name: 'name',
                message: 'What is the package name?',
                default: trim(config.name || name),
                transform(input) {
                    if (name.includes('@terascope')) {
                        return trim(input);
                    }
                    return toKebabCase(trim(input));
                }
            },
            {
                type: 'input',
                name: 'description',
                message: 'Describe what this package does?',
                default: trim(description || config.description)
            },
            {
                type: 'confirm',
                name: 'internal',
                message: 'Is this package designed for only Terascope projects?',
                default: isInternal,
                store: true,
            },
            {
                type: 'confirm',
                name: 'typescript',
                message: 'Will this package be written in Typescript?',
                default: config.typescript != null ? config.typescript : true,
                store: true,
            },
            {
                type: 'confirm',
                name: 'exampleCode',
                message: 'Do you want example code generated?',
                default: config.exampleCode != null ? config.exampleCode : false,
            },
            {
                type: 'list',
                name: 'license',
                message: 'What is the license for this package?',
                default: trim(license),
                choices: ['MIT', 'Apache-2.0'],
            }
        ];

        return this.prompt(prompts).then((props) => {
            // To access props later use this.props.someAnswer;
            this.props = props;
            if (props.internal && props.name.indexOf('@terascope') !== 0) {
                this.props.pkgName = `@terascope/${props.name}`;
            } else {
                this.props.pkgName = props.name;
            }
            this.props.pkgDirName = path.basename(this.destinationRoot());
            this.props.pkgVersion = version;
        });
    }

    writing() {
        const pathExists = (...joins) => {
            const filepath = path.join(...joins);
            if (this.fs.exists(this.destinationPath(filepath))) return true;
            if (fs.existsSync(path.join(process.cwd(), filepath))) return true;
            return false;
        };

        const packageJSON = genPackageJSON(this.props);

        this.fs.extendJSON(
            this.destinationPath('package.json'),
            packageJSON,
            null,
            4
        );

        this.fs.copy(
            this.templatePath('jest.config.js.tmp'),
            this.destinationPath('jest.config.js')
        );

        const licenseExt = this.props.license.toLowerCase();

        this.fs.copy(
            this.templatePath(`LICENSE.${licenseExt}`),
            this.destinationPath('LICENSE')
        );

        this.fs.copyTpl(
            this.templatePath('README.md'),
            this.destinationPath('README.md'),
            this.props
        );

        if (this.props.typescript) {
            this.fs.copy(
                this.templatePath('tsconfig.src.json'),
                this.destinationPath('tsconfig.json')
            );
        }

        const folderName = this.props.typescript ? 'src' : 'lib';
        const ext = this.props.typescript ? '.ts' : '.js';

        if (!pathExists(folderName)) {
            if (this.props.exampleCode) {
                this.fs.copy(
                    this.templatePath(folderName),
                    this.destinationPath(folderName)
                );
            } else {
                this.fs.copy(
                    this.templatePath(path.join(folderName, `index${ext}`)),
                    this.destinationPath(path.join(folderName, `index${ext}`))
                );
            }
        }

        if (!pathExists('test')) {
            this.fs.copy(
                this.templatePath(`test/index-spec${ext}`),
                this.destinationPath(`test/index-spec${ext}`)
            );

            if (this.props.exampleCode) {
                this.fs.copy(
                    this.templatePath(`test/example-spec${ext}`),
                    this.destinationPath(`test/example-spec${ext}`)
                );
            }
        }
    }

    install() {
        return this.installDependencies({
            npm: false,
            bower: false,
            yarn: true
        });
    }
};
