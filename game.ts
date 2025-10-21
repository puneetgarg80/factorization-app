/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { caseFiles } from './data';
import { gameState, userProgress } from './state';
import * as dom from './dom';
import * as ui from './ui';
import * as validation from './validation';
import { formatExpression, termToString } from './utils';
import type { CaseFile } from './types';

export function loadCase(caseData: CaseFile) {
    gameState.currentCase = caseData;
    gameState.selectedFactors = [null, null];

    dom.caseTitleEl.textContent = caseData.title;
    dom.caseNumberEl.textContent = `Case #${String(caseData.id).padStart(3, '0')}`;
    dom.caseNarrativeEl.textContent = caseData.narrative;
    dom.briefingExpressionEl.innerHTML = formatExpression(caseData.expression);

    ui.renderEvidenceBoard();
    ui.resetInvestigationUI();
    
    dom.closedExpressionEl.innerHTML = formatExpression(caseData.expression);
    dom.closedSolutionEl.textContent = `(${caseData.solution.join(')(')})`;

    ui.switchScreen('briefing');
}

export function startGame() {
    ui.switchScreen('investigation');
}

export function validateSolution() {
    const { expression } = gameState.currentCase;
    
    const factorGroups = document.querySelectorAll('.factor-group');
    const factors: (string | number | null)[][] = [];
    let globalDropZoneIndex = 0;
    
    factorGroups.forEach(group => {
        const terms: (string | number | null)[] = [];
        group.querySelectorAll('.drop-zone').forEach(() => {
            terms.push(gameState.selectedFactors[globalDropZoneIndex]);
            globalDropZoneIndex++;
        });
        factors.push(terms);
    });

    if (factors.some(f => f.some(t => t === null))) {
        dom.liveFeedbackAreaEl.innerHTML = '<p class="text-yellow-400">Please fill all the empty slots.</p>';
        return;
    }
    
    let resultPoly;
    try {
        const polyFactors = factors.map(validation.parseFactor);
        resultPoly = polyFactors.reduce((acc, poly) => validation.multiplyPolynomials(acc, poly), new Map([['const', 1]]));
    } catch (e) {
        console.error("Validation error:", e);
        dom.liveFeedbackAreaEl.innerHTML = '<p class="text-red-400">Error: Could not compute the product of your theory.</p>';
        return;
    }

    const targetPoly = validation.expressionToPolyMap(expression);
    const diff = validation.diffPolyMaps(targetPoly, resultPoly);

    let feedbackHTML = `<p>Your theory expands to: <span class="font-bold">${formatExpression(validation.polyMapToString(resultPoly)) || '0'}</span></p>`;
    
    if (diff.mismatched.length === 0 && diff.missing.length === 0 && diff.extra.length === 0) {
        feedbackHTML += '<p class="text-green-400 font-bold mt-2">That matches the evidence perfectly! Case closed.</p>';
        dom.liveFeedbackAreaEl.innerHTML = feedbackHTML;
        dom.feedbackOverlayEl.innerHTML = '✅';
        dom.feedbackOverlayEl.classList.add('show');
        setTimeout(completeCase, 1500);
    } else {
        feedbackHTML += `<div class="mt-2 space-y-1">`;
        diff.mismatched.forEach(item => {
            const resultTerm = termToString(item.term, item.resultCoeff);
            const targetTerm = termToString(item.term, item.targetCoeff);
            feedbackHTML += `<p><span class="text-yellow-400">Mismatched:</span> Your theory has <b class="text-red-400">${formatExpression(resultTerm)}</b>, but it should be <b class="text-green-400">${formatExpression(targetTerm)}</b>.</p>`;
        });
        diff.missing.forEach(item => {
            const targetTerm = termToString(item.term, item.targetCoeff);
            feedbackHTML += `<p><span class="text-red-400">Missing:</span> The evidence includes <b class="text-green-400">${formatExpression(targetTerm)}</b>, which is not in your result.</p>`;
        });
        diff.extra.forEach(item => {
            const resultTerm = termToString(item.term, item.resultCoeff);
            feedbackHTML += `<p><span class="text-blue-400">Extra:</span> Your result has <b class="text-red-400">${formatExpression(resultTerm)}</b>, which is not in the evidence.</p>`;
        });
        feedbackHTML += `</div>`;
        dom.liveFeedbackAreaEl.innerHTML = feedbackHTML;
        dom.feedbackOverlayEl.innerHTML = '❌';
        dom.feedbackOverlayEl.classList.add('show');
        setTimeout(() => dom.feedbackOverlayEl.classList.remove('show'), 1000);
    }
}

function completeCase() {
    userProgress.solvedCaseIds.push(gameState.currentCase.id);
    
    if (checkForPatternDiscovery()) {
        setupPatternDiscovery();
        ui.switchScreen('patternDiscovery');
    } else {
        ui.switchScreen('caseClosed');
    }
}

function checkForPatternDiscovery(): boolean {
     const sumProductCasesSolved = caseFiles.filter(c => 
        c.patternId === 'sum-product' && userProgress.solvedCaseIds.includes(c.id)
    ).length;

    return sumProductCasesSolved >= 2 && !userProgress.discoveredPatterns['sum-product'];
}

function setupPatternDiscovery() {
    dom.patternExamplesEl.innerHTML = '';
    const solvedCases = caseFiles.filter(c => userProgress.solvedCaseIds.includes(c.id) && c.patternId === 'sum-product');
    
    solvedCases.forEach(c => {
        const solution = `(${c.solution.join(')(')})`;
        dom.patternExamplesEl.innerHTML += `
            <p class="text-gray-700"><span class="font-bold">${formatExpression(c.expression)}</span> → You found the factors <span class="font-bold">${solution}</span>.</p>
        `;
    });
}

export function savePattern() {
    const userInput = dom.patternInput.value;
    if(userInput.trim().length > 10) {
        userProgress.discoveredPatterns['sum-product'] = userInput;
        ui.switchScreen('caseClosed');
    } else {
        alert("Please describe the pattern in a bit more detail for your notebook!");
    }
}

export function loadNextCase() {
    gameState.currentCaseIndex++;
    if (gameState.currentCaseIndex < caseFiles.length) {
        loadCase(caseFiles[gameState.currentCaseIndex]);
    } else {
        alert("You've solved all the available cases! Congratulations, Detective!");
        gameState.currentCaseIndex = 0;
        userProgress.solvedCaseIds = [];
        userProgress.discoveredPatterns = {};
        loadCase(caseFiles[0]);
    }
}
