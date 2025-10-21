/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Describes a single case file for the detective game.
 */
export interface CaseFile {
    id: number;
    title: string;
    narrative: string;
    expression: string;
    solution: string[];
    clues: (string | number)[];
    patternId: string;
    coeffs?: number[];
}

/**
 * Represents the current state of the game.
 */
export interface GameState {
    currentScreen: string;
    currentCaseIndex: number;
    currentCase: CaseFile | null;
    selectedFactors: (string | number | null)[];
    draggedValue: string | number | null;
}

/**
 * Tracks the user's progress through the game.
 */
export interface UserProgress {
    rank: string;
    solvedCaseIds: number[];
    discoveredPatterns: Record<string, string>;
}

/**
 * Holds state for touch-based drag and drop operations.
 */
export interface TouchState {
    isDragging: boolean;
    ghostElement: HTMLElement | null;
    draggedElement: HTMLElement | null;
    lastTarget: HTMLElement | null;
}

/**
 * Represents a polynomial as a map of terms to coefficients.
 * e.g., 'x:2' -> 1 (for x²), 'const' -> 5
 */
export type PolyMap = Map<string, number>;
