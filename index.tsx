/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { caseFiles } from './data';
import { gameState } from './state';
import { loadCase, startGame, validateSolution, loadNextCase, savePattern } from './game';
import { inspectEvidence, addTerm, removeTerm, showClues, handleDragStart, handleTouchStart } from './ui';

// Expose functions to the global scope for onclick attributes in HTML
// when using type="module" for the script tag.
Object.assign(window, {
    startGame,
    inspectEvidence,
    validateSolution,
    loadNextCase,
    savePattern,
    addTerm,
    removeTerm,
    showClues,
    handleDragStart,
    handleTouchStart,
});

window.onload = () => {
    if (caseFiles.length > 0) {
        loadCase(caseFiles[gameState.currentCaseIndex]);
    }
};
