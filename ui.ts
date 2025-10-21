/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { gameState, touchState } from './state';
import * as dom from './dom';
import { formatExpression, getPrimeFactors } from './utils';

export function switchScreen(screenName: keyof typeof dom.screens) {
    Object.values(dom.screens).forEach(screen => screen.classList.remove('active'));
    if (dom.screens[screenName]) {
        dom.screens[screenName].classList.add('active');
        gameState.currentScreen = screenName;
    }
}

export function checkAllFactorsFilled() {
    const allFilled = gameState.selectedFactors.every(factor => factor !== null);
    dom.validateBtn.disabled = !allFilled;
}

// --- DRAG & DROP LOGIC ---
export function handleDragStart(event: DragEvent, value: string | number) {
    gameState.draggedValue = value;
    event.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(event: DragEvent) {
    event.preventDefault();
    (event.target as HTMLElement).classList.add('drag-over');
}

function handleDragLeave(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('drag-over');
}

function handleDrop(event: DragEvent, zoneIndex: number) {
    event.preventDefault();
    const dropZone = (event.target as HTMLElement).closest('.drop-zone') as HTMLElement;
    if (!dropZone) return;

    dropZone.classList.remove('drag-over');
    
    if (gameState.draggedValue !== null) {
        const value = isNaN(Number(gameState.draggedValue)) ? gameState.draggedValue : Number(gameState.draggedValue);
        gameState.selectedFactors[zoneIndex] = value;
        dropZone.innerHTML = formatExpression(String(gameState.draggedValue));
        gameState.draggedValue = null;
        checkAllFactorsFilled();
    }
}

export function handleTouchStart(event: TouchEvent, value: string | number, element: HTMLElement) {
    if (event.cancelable) event.preventDefault();
    
    touchState.isDragging = true;
    touchState.draggedElement = element;
    gameState.draggedValue = value;

    element.classList.add('dragging');

    touchState.ghostElement = element.cloneNode(true) as HTMLElement;
    touchState.ghostElement.classList.add('ghost-drag');
    document.body.appendChild(touchState.ghostElement);

    const touch = event.touches[0];
    const rect = element.getBoundingClientRect();
    touchState.ghostElement.style.width = `${rect.width}px`;
    touchState.ghostElement.style.height = `${rect.height}px`;
    touchState.ghostElement.style.left = `${touch.pageX - rect.width / 2}px`;
    touchState.ghostElement.style.top = `${touch.pageY - rect.height / 2}px`;
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
}

function handleTouchMove(event: TouchEvent) {
    if (!touchState.isDragging || !touchState.ghostElement) return;
    if (event.cancelable) event.preventDefault();

    const touch = event.touches[0];
    
    const ghostRect = touchState.ghostElement.getBoundingClientRect();
    touchState.ghostElement.style.left = `${touch.pageX - ghostRect.width / 2}px`;
    touchState.ghostElement.style.top = `${touch.pageY - ghostRect.height / 2}px`;

    touchState.ghostElement.style.display = 'none';
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    touchState.ghostElement.style.display = '';

    const dropZone = elementUnder ? elementUnder.closest('.drop-zone') as HTMLElement : null;

    if (touchState.lastTarget && touchState.lastTarget !== dropZone) {
        touchState.lastTarget.classList.remove('drag-over');
    }

    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
    touchState.lastTarget = dropZone;
}

function handleTouchEnd() {
    if (!touchState.isDragging) return;

    if (touchState.lastTarget) {
        touchState.lastTarget.classList.remove('drag-over');
        const zoneIndex = parseInt(touchState.lastTarget.dataset.zoneIndex, 10);

        if (!isNaN(zoneIndex) && gameState.draggedValue !== null) {
            const value = isNaN(Number(gameState.draggedValue)) ? gameState.draggedValue : Number(gameState.draggedValue);
            gameState.selectedFactors[zoneIndex] = value;
            touchState.lastTarget.innerHTML = formatExpression(String(gameState.draggedValue));
            checkAllFactorsFilled();
        }
    }

    if (touchState.draggedElement) touchState.draggedElement.classList.remove('dragging');
    if (touchState.ghostElement && touchState.ghostElement.parentNode) {
        document.body.removeChild(touchState.ghostElement);
    }
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);

    touchState.isDragging = false;
    touchState.ghostElement = null;
    touchState.draggedElement = null;
    touchState.lastTarget = null;
    gameState.draggedValue = null;
}

// --- UI UPDATES ---
export function updateDropZoneListeners(resetContent = true) {
    const dropZones = document.querySelectorAll('.drop-zone');
    const newSelectedFactors: (string | number | null)[] = [];

    dropZones.forEach((zoneNode, index) => {
        const zone = zoneNode as HTMLElement;
        if (!resetContent && zone.textContent !== '?') {
            const value = isNaN(Number(zone.textContent)) ? zone.textContent : Number(zone.textContent);
            newSelectedFactors[index] = value as (string | number);
        } else {
            newSelectedFactors[index] = null;
        }

        if (resetContent) {
            zone.textContent = '?';
        }

        const newZone = zone.cloneNode(true) as HTMLElement;
        zone.parentNode.replaceChild(newZone, zone);

        newZone.dataset.zoneIndex = String(index);
        newZone.addEventListener('dragover', handleDragOver);
        newZone.addEventListener('dragleave', handleDragLeave);
        newZone.addEventListener('drop', (e) => handleDrop(e, index));
    });

    gameState.selectedFactors = newSelectedFactors;
    checkAllFactorsFilled();
}

export function addTerm(buttonEl: HTMLElement) {
    const factorGroup = buttonEl.closest('.factor-group');
    const termsContainer = factorGroup.querySelector('.terms-container');
    
    const operator = document.createElement('span');
    operator.className = 'op mx-0.5 text-2xl';
    operator.textContent = '+';

    const newDropZone = document.createElement('div');
    newDropZone.className = 'drop-zone w-10 h-10 sm:w-12 sm:h-12 rounded-lg';
    newDropZone.textContent = '?';

    termsContainer.appendChild(operator);
    termsContainer.appendChild(newDropZone);
    
    updateDropZoneListeners(false);
}

export function removeTerm(buttonEl: HTMLElement) {
    const factorGroup = buttonEl.closest('.factor-group');
    const termsContainer = factorGroup.querySelector('.terms-container');
    const dropZonesInGroup = Array.from(termsContainer.querySelectorAll('.drop-zone')) as HTMLElement[];
    
    let targetToRemove = -1;

    for (let i = dropZonesInGroup.length - 1; i >= 0; i--) {
        if (dropZonesInGroup[i].textContent === '?') {
            targetToRemove = i;
            break;
        }
    }

    if (targetToRemove === -1 && dropZonesInGroup.length > 1) {
        targetToRemove = dropZonesInGroup.length - 1;
    }
    
    if (targetToRemove !== -1) {
        const operator = dropZonesInGroup[targetToRemove].previousElementSibling;
        termsContainer.removeChild(dropZonesInGroup[targetToRemove]);
        if (operator && operator.classList.contains('op')) {
            termsContainer.removeChild(operator);
        }
        
        updateDropZoneListeners(false);
    }
}

export function renderEvidenceBoard() {
    const expr = gameState.currentCase.expression;
    dom.evidenceBoardEl.innerHTML = `<div class="term-tile p-2 rounded-lg" onclick="showClues()">${formatExpression(expr)}</div>`;
}

export function showClues() {
    const { clues } = gameState.currentCase;
    dom.cluePanelEl.innerHTML = ''; 

    let clueHTML = `<div class="bg-gray-800 p-4 rounded-lg">
        <h3 class="font-bold text-xl mb-2">Available Clues</h3>
        <p class="text-sm text-gray-300 mb-3">Drag these suspects to the Interrogation Room.</p>
        <div class="flex flex-wrap gap-2">`;
    
    clues.forEach(clue => {
        const isString = typeof clue === 'string';
        const displayValue = isString ? `'${clue}'` : clue;
        clueHTML += `
            <div draggable="true" ondragstart="handleDragStart(event, ${displayValue})" ontouchstart="handleTouchStart(event, ${displayValue}, this)" class="suspect-pair p-2 bg-gray-900 rounded">
                <span>${formatExpression(clue.toString())}</span>
            </div>`;
    });

    clueHTML += `</div></div>`;
    dom.cluePanelEl.innerHTML = clueHTML;
}

export function inspectEvidence() {
    const { expression } = gameState.currentCase;
    const terms = expression.replace(/ - /g, ' + -').split(' + ');
    
    let inspectionHTML = `<div class="bg-gray-800 p-4 rounded-lg">
        <h3 class="font-bold text-xl mb-2">Inspection Results</h3>
        <div class="space-y-3">`;

    terms.forEach(term => {
        const numericFactors = getPrimeFactors(parseInt(term, 10) || 1); // Simplified for now
        inspectionHTML += `
            <div class="p-2 bg-gray-900 rounded">
                <span class="font-bold text-lg">${formatExpression(term)}</span> &rarr; <span class="text-yellow-300">${numericFactors.join(' &middot; ')}</span>
            </div>`;
    });
    
    inspectionHTML += `</div></div>`;
    dom.cluePanelEl.innerHTML = inspectionHTML;
}

export function resetInvestigationUI() {
    dom.cluePanelEl.innerHTML = `<p class="text-gray-400 italic text-center">Click on the evidence or the inspection tool to begin.</p>`;
    dom.liveFeedbackAreaEl.innerHTML = '';
    dom.interrogationOutlineEl.innerHTML = `
        <div class="factor-group flex items-center p-1 sm:p-2 bg-gray-800 rounded-lg">
            <span>(</span>
            <div class="terms-container flex items-center flex-wrap gap-0.5">
                <div class="drop-zone w-10 h-10 sm:w-12 sm:h-12 rounded-lg">?</div>
            </div>
            <span>)</span>
            <div class="flex flex-col ml-1 space-y-1">
                <button class="term-control-btn text-base" onclick="addTerm(this)">+</button>
                <button class="term-control-btn text-base" onclick="removeTerm(this)">-</button>
            </div>
        </div>
        <span class="my-2 md:my-0 text-2xl sm:text-3xl">&times;</span>
        <div class="factor-group flex items-center p-1 sm:p-2 bg-gray-800 rounded-lg">
            <span>(</span>
            <div class="terms-container flex items-center flex-wrap gap-0.5">
                <div class="drop-zone w-10 h-10 sm:w-12 sm:h-12 rounded-lg">?</div>
            </div>
            <span>)</span>
            <div class="flex flex-col ml-1 space-y-1">
                <button class="term-control-btn text-base" onclick="addTerm(this)">+</button>
                <button class="term-control-btn text-base" onclick="removeTerm(this)">-</button>
            </div>
        </div>
    `;
    
    updateDropZoneListeners(true);
    
    dom.feedbackOverlayEl.innerHTML = '';
    dom.feedbackOverlayEl.classList.remove('show');
}
