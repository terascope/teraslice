import { trim } from '@terascope/utils';
import { SchemaDirectiveVisitor, } from 'graphql-tools';
import { GraphQLField } from 'graphql';
import FieldTrasform from '../../transforms/field-transform';

interface KeyConfig {
    [key: string]: any;
}

function parserConfig(config: KeyConfig) {
    const results: string[] = [];
    for (const [key, keyConfig] of Object.entries(config)) {
        results.push(`${key}: ${keyConfig.type as string} `);
    }
    return results;
}

class DeprecatedDirective extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { resolve, defaultFieldResolver } = field;
        field.resolve = async function myUpperTest(...args: any[]) {
            // @ts-ignore
            const result = await resolve.apply(this, args);
            if (typeof result === 'string') {
                return result.toUpperCase();
            }
            return result;
        };
    }
}

export function createGqlDirectives() {
    const types: string[] = [];
    const directives: { [key: string]: any } = {};

    for (const [name, config] of Object.entries(FieldTrasform.registry)) {
        const configTypes = parserConfig(config).join('');
        const args = configTypes.length > 0 ? `(${trim(configTypes)})` : '';
        types.push(`directive @${name}${args} on on FIELD_DEFINITION | FIELD`);
        directives[name] = DeprecatedDirective;
    }

    return { types, directives };
}
