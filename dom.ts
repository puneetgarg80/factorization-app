/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const screens = {
    briefing: document.getElementById('case-briefing-screen') as HTMLElement,
    investigation: document.getElementById('investigation-screen') as HTMLElement,
    caseClosed: document.getElementById('case-closed-screen') as HTMLElement,
    patternDiscovery: document.getElementById('pattern-discovery-screen') as HTMLElement,
};

export const caseTitleEl = document.getElementById('case-title') as HTMLElement;
export const caseNumberEl = document.getElementById('case-number') as HTMLElement;
export const caseNarrativeEl = document.getElementById('case-narrative') as HTMLElement;
export const briefingExpressionEl = document.getElementById('briefing-expression') as HTMLElement;
export const closedExpressionEl = document.getElementById('closed-expression') as HTMLElement;
export const closedSolutionEl = document.getElementById('closed-solution') as HTMLElement;
export const evidenceBoardEl = document.getElementById('evidence-board') as HTMLElement;
export const cluePanelEl = document.getElementById('clue-panel') as HTMLElement;
export const liveFeedbackAreaEl = document.getElementById('live-feedback-area') as HTMLElement;
export const interrogationOutlineEl = document.getElementById('interrogation-outline') as HTMLElement;
export const feedbackOverlayEl = document.getElementById('feedback-overlay') as HTMLElement;
export const validateBtn = document.getElementById('validate-btn') as HTMLButtonElement;
export const patternExamplesEl = document.getElementById('pattern-examples') as HTMLElement;
export const patternInput = document.getElementById('pattern-input') as HTMLTextAreaElement;
