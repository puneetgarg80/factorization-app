/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { PolyMap } from './types';
import { fromSuperscript, termToString } from './utils';

/**
 * Parses an array of terms into a polynomial map.
 * @param terms An array of strings or numbers representing terms.
 * @returns A PolyMap representation of the factor.
 */
export function parseFactor(terms: (string | number | null)[]): PolyMap {
    const poly: PolyMap = new Map();
    terms.forEach(term => {
        if (term === null) return;

        if (typeof term === 'number') {
            const key = 'const';
            poly.set(key, (poly.get(key) || 0) + term);
        } else if (typeof term === 'string') {
            const expr = term.toString();
            const match = expr.match(/^(-?\d*)?([a-zA-Z])(\^(\d)|²|³|⁴)?$/);
            if (!match) return;
            
            let coeffPart = match[1];
            let variable = match[2];
            let powerPart = match[3] ? (match[4] || fromSuperscript(match[3]).toString()) : '1';

            let coeff = 1;
            if (coeffPart === '-') coeff = -1;
            else if (coeffPart) coeff = parseInt(coeffPart, 10);
            
            let power = parseInt(powerPart, 10);
            
            const key = `${variable}:${power}`;
            poly.set(key, (poly.get(key) || 0) + coeff);
        }
    });
    return poly;
}

/**
 * Multiplies two polynomial maps.
 * @param poly1 The first polynomial map.
 * @param poly2 The second polynomial map.
 * @returns A new PolyMap representing the product.
 */
export function multiplyPolynomials(poly1: PolyMap, poly2: PolyMap): PolyMap {
    const result: PolyMap = new Map();
    if (poly1.size === 0) return poly2;
    if (poly2.size === 0) return poly1;

    for (const [term1, coeff1] of poly1.entries()) {
        for (const [term2, coeff2] of poly2.entries()) {
            const newCoeff = coeff1 * coeff2;
            const newTerms: Map<string, number> = new Map();

            if (term1 !== 'const') {
                term1.split(',').forEach(t => {
                    const [variable, power] = t.split(':');
                    newTerms.set(variable, (newTerms.get(variable) || 0) + parseInt(power));
                });
            }
            
            if (term2 !== 'const') {
                term2.split(',').forEach(t => {
                    const [variable, power] = t.split(':');
                    newTerms.set(variable, (newTerms.get(variable) || 0) + parseInt(power));
                });
            }

            let newKey;
            if (newTerms.size === 0) {
                newKey = 'const';
            } else {
                newKey = Array.from(newTerms.entries())
                    .sort(([varA], [varB]) => varA.localeCompare(varB))
                    .map(([variable, power]) => `${variable}:${power}`)
                    .join(',');
            }
            
            result.set(newKey, (result.get(newKey) || 0) + newCoeff);
        }
    }
    return result;
}

/**
 * Converts a polynomial map back into a formatted string.
 * @param poly The polynomial map to convert.
 * @returns A string representation of the polynomial.
 */
export function polyMapToString(poly: PolyMap): string {
    if (poly.size === 0) return '0';

    const termStrings: string[] = [];
    const sortedTerms = Array.from(poly.entries()).sort(([keyA], [keyB]) => {
        if (keyA === 'const') return 1;
        if (keyB === 'const') return -1;
        const powerA = parseInt(keyA.split(':')[1] || '0', 10);
        const powerB = parseInt(keyB.split(':')[1] || '0', 10);
        if (powerA !== powerB) return powerB - powerA;
        return keyA.localeCompare(keyB);
    });

    sortedTerms.forEach(([term, coeff], index) => {
        if (coeff === 0) return;
        
        let termStr = '';
        const absCoeff = Math.abs(coeff);
        
        if (index > 0) {
            termStr += coeff > 0 ? ' + ' : ' - ';
        } else if (coeff < 0) {
            termStr += '-';
        }

        if (term === 'const') {
            termStr += absCoeff.toString();
        } else {
            if (absCoeff !== 1 || term.split(':')[0].length === 0) termStr += absCoeff;
            
            term.split(',').forEach(t => {
                const [variable, power] = t.split(':');
                termStr += variable;
                if (Number(power) > 1) {
                    termStr += `<sup>${power}</sup>`;
                }
            });
        }
        termStrings.push(termStr);
    });

    return termStrings.join('');
}

/**
 * Converts an expression string (like "x²+5x+6") into a polynomial map.
 * @param expr The expression string.
 * @returns A PolyMap representation of the expression.
 */
export function expressionToPolyMap(expr: string): PolyMap {
    const poly: PolyMap = new Map();
    let exprWithCaret = expr.replace(/([a-zA-Z])([²³⁴])/g, (_, v, p) => `${v}^${fromSuperscript(p)}`)
                            .replace(/([a-zA-Z])(?!\^)/g, '$1^1');

    const normalizedExpr = exprWithCaret.replace(/\s/g, '').replace(/-/g, '+-');
    const terms = normalizedExpr.split('+').filter(t => t);

    terms.forEach(term => {
        const match = term.match(/(-?\d*\.?\d*)?([a-zA-Z]+)(?:\^(\d+))?/);
        
        if (match) {
            let coeff = 1;
            if (match[1] === '-') coeff = -1;
            else if (match[1]) coeff = parseFloat(match[1]);

            const variables = match[2];
            const power = parseInt(match[3] || '1', 10);
            const key = `${variables}:${power}`;
            poly.set(key, (poly.get(key) || 0) + coeff);
        } else {
            const coeff = parseFloat(term);
            if (!isNaN(coeff)) {
                poly.set('const', (poly.get('const') || 0) + coeff);
            }
        }
    });
    return poly;
}

/**
 * Compares two polynomial maps and returns the differences.
 * @param target The target polynomial.
 * @param result The result polynomial to compare against.
 * @returns An object detailing mismatched, missing, and extra terms.
 */
export function diffPolyMaps(target: PolyMap, result: PolyMap) {
    const diff = {
        mismatched: [] as { term: string; targetCoeff: number; resultCoeff: number }[],
        missing: [] as { term: string; targetCoeff: number }[],
        extra: [] as { term: string; resultCoeff: number }[]
    };
    const allKeys = new Set([...target.keys(), ...result.keys()]);

    for (const key of allKeys) {
        const targetCoeff = target.get(key) || 0;
        const resultCoeff = result.get(key) || 0;

        if (targetCoeff === resultCoeff) {
            continue;
        }
        if (targetCoeff !== 0 && resultCoeff !== 0) {
            diff.mismatched.push({ term: key, targetCoeff, resultCoeff });
        } else if (targetCoeff !== 0 && resultCoeff === 0) {
            diff.missing.push({ term: key, targetCoeff });
        } else if (targetCoeff === 0 && resultCoeff !== 0) {
            diff.extra.push({ term: key, resultCoeff });
        }
    }
    return diff;
}
