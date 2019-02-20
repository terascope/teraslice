import _ from 'lodash';
import { TSError } from '@terascope/utils';
import LuceneQueryParser from '../lucene-query-parser';
import { AST, IMPLICIT } from '../interfaces';

interface Config {
    excludes?: string[];
    includes?: string[];
    constraint?: string;
    prevent_prefix_wildcard?: boolean;
}

export default class LuceneQueryAccess {
    public excludes: string[];
    public includes: string[];
    public constraint?: string;
    public preventPrefixWildcard: boolean;

    constructor(config: Config) {
        const {
            excludes = [],
            includes = [],
            constraint,
            prevent_prefix_wildcard
        } = config;

        this.excludes = excludes;
        this.includes = includes;
        this.constraint = constraint;
        this.preventPrefixWildcard = !!prevent_prefix_wildcard;
    }

    restrict(input: string): string {
        let query = input;
        if (this.includes.length && !query.length) {
            throw new TSError('Empty queries are restricted', {
                statusCode: 403
            });
        }

        const parser = new LuceneQueryParser();
        parser.parse(query);
        parser.walkLuceneAst((node: AST, field: string) => {
            // restrict when a term is specified without a field
            if (node.field && !field) {
                throw new TSError('Implicit queries are restricted', {
                    statusCode: 403
                });
            }

            if (!node.field || node.field === IMPLICIT) return;

            if (isFieldExcluded(this.excludes, node.field)) {
                throw new TSError(`Field ${node.field} is restricted`, {
                    statusCode: 403
                });
            }

            if (isFieldIncluded(this.includes, node.field)) {
                throw new TSError(`Field ${node.field} is restricted`,  {
                    statusCode: 403
                });
            }

            if (this.preventPrefixWildcard && startsWithWildcard(node.term)) {
                throw new TSError('Prefix wildcards are restricted',  {
                    statusCode: 403
                });
            }
        });

        if (this.constraint) {
            query = `${query} AND ${this.constraint}`;
        }

        return query;
    }
}

function isFieldExcluded(exclude: string[], field: string): boolean {
    if (!exclude.length) return false;
    return _.some(exclude, (str) => _.startsWith(field, str));
}

function isFieldIncluded(include: string[], field: string): boolean {
    if (!include.length) return false;
    return !_.some(include, (str) => _.startsWith(field, str));
}

function getFirstChar(input: string) {
    return input.trim().charAt(0);
}

function startsWithWildcard(input?: string|number) {
    if (!input) return false;
    if (!_.isString(input)) return false;

    return ['*', '?'].includes(getFirstChar(input));
}
