/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { GameState, UserProgress, TouchState } from './types';

export let gameState: GameState = {
    currentScreen: 'briefing',
    currentCaseIndex: 0,
    currentCase: null,
    selectedFactors: [null, null],
    draggedValue: null,
};

export let userProgress: UserProgress = {
    rank: "Rookie",
    solvedCaseIds: [],
    discoveredPatterns: {},
};

export let touchState: TouchState = {
    isDragging: false,
    ghostElement: null,
    draggedElement: null,
    lastTarget: null,
};
