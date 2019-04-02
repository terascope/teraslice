'use strict';

const path = require('path');
const _ = require('lodash');
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.argument('new_asset_path', { type: String, required: true });
    }

    async prompting() {
        this.answers = await this.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Name of the new asset:',
                validate: (value) => {
                    if (value.length < 1) {
                        return 'must contain a value';
                    }
                    return true;
                },
                filter: value => _.kebabCase(value)
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description of the new asset:'
            }
        ]);
    }

    paths() {
        this.destinationRoot(path.join(this.options.new_asset_path, this.answers.name));
    }

    default() {
        // copy over root files
        this.fs.copyTpl(this.templatePath('package.json'), this.destinationPath('package.json'),
            {
                name: this.answers.name,
                description: this.answers.description
            });

        this.fs.copyTpl(this.templatePath('eslintrc.json'), this.destinationPath('.eslintrc'));
        this.fs.copyTpl(this.templatePath('README.md'), this.destinationPath('README.md'), {
            name: this.answers.name,
            description: this.answers.description
        });
        this.fs.copyTpl(this.templatePath('editorConfig'), this.destinationPath('.editorconfig'));

        // copy asset files
        this.fs.copyTpl(
            this.templatePath('asset/asset.json'),
            this.destinationPath('asset/asset.json'),
            {
                name: this.answers.name,
                description: this.answers.description
            },
        );

        this.fs.copyTpl(
            this.templatePath('asset/package.json'),
            this.destinationPath('asset/package.json'),
            {
                name: this.answers.name,
                description: this.answers.description
            },
        );
    }

    addExampleProcessor() {
        const assetPath = path.join(this.options.new_asset_path, this.answers.name);
        this.composeWith(require.resolve('../new-processor'), { arguments: [assetPath] });
    }

    install() {
        this.useYarn = false;
        // if yarn is installed use yarn to install packages
        const yarnPath = this.spawnCommandSync('which', ['bob'], {
            stdio: [process.stdout],
            encoding: 'utf8'
        });

        if (yarnPath.stdout) {
            this.useYarn = true;
        }

        return this.installDependencies({
            npm: !this.useYarn,
            bower: false,
            yarn: this.useYarn
        });
    }

    end() {
        if (this.useYarn) {
            return this.yarnInstall('', {}, { cwd: path.join(path.join(this.options.new_asset_path, this.answers.name, 'asset')) });
        }
        return this.npmInstall('', {}, { cwd: path.join(path.join(this.options.new_asset_path, this.answers.name, 'asset')) });
    }
};
