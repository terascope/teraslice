
import path from 'path';
import _ from 'lodash';
import Generator from 'yeoman-generator';
import { getTemplatePath } from '../utils';

export default class extends Generator {
    answers!: any;

    constructor(args: any, opts: any) {
        super(args, opts);
        this.argument('asset_path', { type: String, required: true });
        this.option('new', {});
        this.sourceRoot(getTemplatePath('new-processor'));
    }

    async prompting() {
        if (this.options.new === true) {
            this.answers = await this.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'New Processor name',
                    validate: (value: string) => {
                        if (value.length < 1) {
                            return 'Please enter a value';
                        }
                        return true;
                    },
                    filter: (value: string) => _.snakeCase(value)
                },
                {
                    type: 'list',
                    name: 'type',
                    message: 'Select the type of processor',
                    choices: [
                        'batch',
                        'map',
                        'filter'
                    ]
                }
            ]);
        }
    }

    paths() {
        this.destinationRoot(path.join(this.options.asset_path));
    }

    createProcessor() {
        function capitolizeFirstLetter(value: string) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }

        let name = 'example';
        let type = 'batch';

        if (this.options.new === true) {
            name = this.answers.name;
            type = this.answers.type;
        }

        this.fs.copyTpl(
            this.templatePath('base-op/schema.js'),
            this.destinationPath(`asset/${name}/schema.js`),
            {}
        );

        this.fs.copyTpl(this.templatePath(`base-op/${type}.js`),
            this.destinationPath(`asset/${name}/processor.js`),
            { name: capitolizeFirstLetter(_.camelCase(name)) });

        this.fs.copyTpl(this.templatePath(`tests/${type}-spec.js`),
            this.destinationPath(`test/${name}-spec.js`),
            { name });
    }
}
