
import _ from 'lodash';
import { TSError } from '@terascope/utils';
import LuceneQueryParser from '../lucene-query-parser';
import { IMPLICIT } from '../constants';
import { AST } from '../interfaces';

interface Config {
    exclude?: string[];
    include?: string[];
    constraint?: string;
}

export default class LuceneQueryAccess {
    public exclude: string[];
    public include: string[];
    public constraint?: string;

    constructor(config: Config) {
        const { exclude = [], include = [], constraint } = config;
        this.exclude = exclude;
        this.include = include;
        this.constraint = constraint;
    }

    restrict(input: string): string {
        let query = input;
        if (this.include.length && !query.length) {
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

            if (isFieldExcluded(this.exclude, node.field)) {
                throw new TSError(`Field ${node.field} is restricted`, {
                    statusCode: 403
                });
            }

            if (isFieldIncluded(this.include, node.field)) {
                throw new TSError(`Field ${node.field} is restricted`,  {
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
