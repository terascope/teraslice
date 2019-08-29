
import path from 'path';
import _ from 'lodash';
import Generator from 'yeoman-generator';
import ProcessorGenerator from '../new-processor';
import { getTemplatePath } from '../utils';

export default class extends Generator {
    answers!: any;
    useYarn?: boolean;

    constructor(args: any, opts: any) {
        super(args, opts);
        this.argument('new_asset_path', { type: String, required: true });
        this.sourceRoot(getTemplatePath('new-asset'));
    }

    async prompting() {
        this.answers = await this.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Name of the new asset:',
                validate: (value: string) => {
                    if (value.length < 1) {
                        return 'must contain a value';
                    }
                    return true;
                },
                filter: (value: string) => _.kebabCase(value)
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

        this.fs.copyTpl(this.templatePath('eslintrc.json'), this.destinationPath('.eslintrc'), {});
        this.fs.copyTpl(this.templatePath('README.md'), this.destinationPath('README.md'), {
            name: this.answers.name,
            description: this.answers.description
        });
        this.fs.copyTpl(this.templatePath('editorConfig'), this.destinationPath('.editorconfig'), {});
        this.fs.copyTpl(this.templatePath('jest.config.js'), this.destinationPath('jest.config.js'), {});
        this.fs.copyTpl(this.templatePath('gitignore'), this.destinationPath('.gitignore'), {});

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
        const processorPath = path.join(__dirname, '../new-processor');
        this.composeWith({
            Generator: ProcessorGenerator,
            path: processorPath
        } as any, { arguments: [assetPath] });
    }

    install() {
        this.useYarn = false;

        // prefer yarn to install packages, check that yarn is on the machine
        // TODO: teraslice-cli could use the global config for a package manager preference
        const yarnPath = this.spawnCommandSync('which', ['yarn'], {
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
}
