'use strict';

const _ = require('lodash');
const path = require('path');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const genPackageJSON = require('./utils/package-json');

module.exports = class extends Generator {
    prompting() {
        this.log(
            yosay(`Welcome to the Teraslice ${chalk.cyan('generator-teraslice:package')} generator!`)
        );

        this.option('typescript');
        const name = path.basename(this.destinationRoot());

        const config = this.config.getAll();

        const prompts = [
            {
                type: 'input',
                name: 'name',
                message: 'What is the package name?',
                default: config.name || name
            },
            {
                type: 'input',
                name: 'description',
                message: 'Describe what this package does?',
                default: config.description || 'A Teraslice package'
            },
            {
                type: 'confirm',
                name: 'internal',
                message: 'Is this package designed for only Terascope projects?',
                default: config.internal != null ? config.internal : false,
                store: true,
            },
            {
                type: 'confirm',
                name: 'typescript',
                message: 'Will this package be written in Typescript?',
                default: config.typescript != null ? config.typescript : true,
                store: true,
            }
        ];

        return this.prompt(prompts).then((props) => {
            props.name = _.kebabCase(props.name);
            // To access props later use this.props.someAnswer;
            this.props = props;
            if (props.name
                && props.internal
                && props.name.indexOf('@terascope') !== 0) {
                this.props.pkgName = `@terascope/${props.name}`;
            } else {
                this.props.pkgName = props.name;
            }
        });
    }

    writing() {
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

        this.fs.copy(
            this.templatePath('LICENSE'),
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

            this.fs.copy(
                this.templatePath('tsconfig.build.json'),
                this.destinationPath('tsconfig.build.json')
            );

            this.fs.copy(
                this.templatePath('src'),
                this.destinationPath('src')
            );

            this.fs.copy(
                this.templatePath('test/index-spec.ts'),
                this.destinationPath('test/index-spec.ts')
            );

            this.fs.copy(
                this.templatePath('test/example-spec.ts'),
                this.destinationPath('test/example-spec.ts')
            );
        } else {
            this.fs.copy(
                this.templatePath('lib'),
                this.destinationPath('lib')
            );

            this.fs.copy(
                this.templatePath('test/index-spec.js'),
                this.destinationPath('test/index-spec.js')
            );

            this.fs.copy(
                this.templatePath('test/example-spec.js'),
                this.destinationPath('test/example-spec.js')
            );
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
