/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Converts an expression string to formatted HTML with superscripts.
 * @param expr The expression string.
 * @returns An HTML-formatted string.
 */
export function formatExpression(expr: string): string {
    if (!expr) return '';
    return expr.replace(/x\^(\d)/g, "x<sup>$1</sup>").replace(/x(\d)/g, "x<sup>$1</sup>").replace(/x\²/g, "x²").replace(/x\³/g, "x³").replace(/x\⁴/g, "x⁴").replace(/\+/g, " + ").replace(/-/g, " - ");
}

/**
 * Gets the prime factors of a number.
 * @param num The number to factorize.
 * @returns An array of prime factors.
 */
export function getPrimeFactors(num: number): number[] {
    const factors: number[] = [];
    let n = Math.abs(num);

    if (num < 0) factors.push(-1);
    if (n === 1 && num > 0) return [1];
    
    let divisor = 2;
    while (n >= 2) {
        if (n % divisor === 0) {
            factors.push(divisor);
            n = n / divisor;
        } else {
            divisor++;
        }
    }
    return factors.length > 0 ? factors : [num];
}

/**
 * Converts a superscript character to a number.
 * @param sup The superscript character.
 * @returns The corresponding number.
 */
export function fromSuperscript(sup: string): number {
    const superscriptMap: Record<string, number> = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
    return superscriptMap[sup] || 1;
}

/**
 * Converts a term and coefficient from a PolyMap to a display string.
 * @param term The term key (e.g., 'x:2').
 * @param coeff The coefficient.
 * @returns A formatted string for the term.
 */
export function termToString(term: string, coeff: number): string {
    if (coeff === 0) return '';
    let termStr = '';
    const absCoeff = Math.abs(coeff);

    if (term === 'const') {
        return coeff.toString();
    }
    
    if (coeff < 0) termStr += '-';

    if (absCoeff !== 1 || term.length === 0) {
        if (absCoeff !== 1 || term.split(':')[0].length === 0) termStr += absCoeff;
    }
    
    term.split(',').forEach(t => {
        const [variable, power] = t.split(':');
        termStr += variable;
        if (Number(power) > 1) {
            termStr += `<sup>${power}</sup>`;
        }
    });
    
    if (termStr === '-') termStr += term.split(',')[0].split(':')[0]; 

    return termStr;
}
