import { Options } from './interfaces';

/**
 * Evaluate a single expression
 *
 * @returns the translated expression
*/
export function evaluate(expression: string, { variables }: Options): string {
    const expr = String(expression).trim();
    for (const [key, value] of Object.entries(variables)) {
        if (expr === key) return value;
    }
    throw new Error(`Invalid expression "${expression}" given`);
}
