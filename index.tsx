/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
        // --- DATA ---
        const caseFiles = [
            {
                id: 0,
                title: "The Fourth Power Puzzle",
                narrative: "A classic Sophie Germain Identity. It looks simple, but the factors are not obvious. You might need to add and subtract a term to find the pattern.",
                expression: "x⁴ + x² + 1",
                solution: ['x²+x+1', 'x²-x+1'],
                clues: ['x²', 'x', '-x', '1'],
                patternId: "sophie-germain",
            },
            {
                id: 1,
                title: "The Difference of Squares",
                narrative: "A classic case of opposites. One is positive, one is negative. What happens when they clash?",
                expression: "x² - y²",
                solution: ['x-y', 'x+y'],
                clues: ['x', 'y', '-y'],
                patternId: "difference-of-squares",
            },
            {
                id: 2,
                title: "The Leading Coefficient",
                narrative: "This case has a twist. The leading coefficient isn't 1. You'll need to consider factors of both the first and last terms.",
                expression: "4x² + 7x + 3",
                coeffs: [4, 7, 3],
                solution: ['4x+3', 'x+1'],
                clues: ['x', '4x', 1, 3],
                patternId: "sum-product-ac",
            },
            {
                id: 3,
                title: "The Grouping Gambit",
                narrative: "This case is different. We have four terms to deal with. Look for common factors between pairs.",
                expression: "x³ + 2x² + 3x + 6",
                coeffs: [1, 2, 3, 6],
                solution: ['x+2', 'x²+3'],
                clues: ['x', 'x²', '2', '3'],
                patternId: "grouping",
            },
            {
                id: 4,
                title: "The Midtown Collision",
                narrative: "A simple collision at the corner of 5th and 6th Avenue. Looks routine, but let's see what the evidence tells us.",
                expression: "x² + 5x + 6",
                coeffs: [1, 5, 6],
                solution: ['x+2', 'x+3'],
                clues: ['x', 2, 3],
                patternId: "sum-product",
            },
            {
                id: 5,
                title: "The Negative Force",
                narrative: "This one's messy. The collision involved a negative element. Be careful, Detective.",
                expression: "x² - 2x - 15",
                coeffs: [1, -2, -15],
                solution: ['x+3', 'x-5'],
                clues: ['x', 3, -5],
                patternId: "sum-product",
            },
            {
                id: 6,
                title: "The Double Negative",
                narrative: "Two negatives were involved here. They say two negatives make a positive, let's see if that's true.",
                expression: "x² - 9x + 20",
                coeffs: [1, -9, 20],
                solution: ['x-4', 'x-5'],
                clues: ['x', -4, -5],
                patternId: "sum-product",
            },
            {
                id: 7,
                title: "The Downtown Derby",
                narrative: "This one happened fast. The numbers are a bit bigger, but the method should be the same.",
                expression: "x² + 7x + 12",
                coeffs: [1, 7, 12],
                solution: ['x+3', 'x+4'],
                clues: ['x', 3, 4],
                patternId: "sum-product",
            }
        ];

        // --- GAME STATE & USER PROGRESS ---
        let gameState = {
            currentScreen: 'briefing',
            currentCaseIndex: 0,
            currentCase: null,
            selectedFactors: [null, null],
            draggedValue: null,
        };

        let userProgress = {
            rank: "Rookie",
            solvedCaseIds: [],
            discoveredPatterns: {},
        };

        // State for touch-based drag/drop
        let touchState = {
            isDragging: false,
            ghostElement: null,
            draggedElement: null,
            lastTarget: null,
        };

        // --- DOM ELEMENTS ---
        const screens = {
            briefing: document.getElementById('case-briefing-screen'),
            investigation: document.getElementById('investigation-screen'),
            caseClosed: document.getElementById('case-closed-screen'),
            patternDiscovery: document.getElementById('pattern-discovery-screen'),
        };
        const dropZone1 = document.getElementById('drop-zone-1');
        const dropZone2 = document.getElementById('drop-zone-2');

        // --- CORE LOGIC ---
        
        function switchScreen(screenName) {
            Object.values(screens).forEach(screen => screen.classList.remove('active'));
            if (screens[screenName]) {
                screens[screenName].classList.add('active');
                gameState.currentScreen = screenName;
            }
        }

        function loadCase(caseData) {
            gameState.currentCase = caseData;
            gameState.selectedFactors = [null, null];

            // Briefing Screen
            document.getElementById('case-title').textContent = caseData.title;
            document.getElementById('case-number').textContent = `Case #${String(caseData.id).padStart(3, '0')}`;
            document.getElementById('case-narrative').textContent = caseData.narrative;
            document.getElementById('briefing-expression').innerHTML = formatExpression(caseData.expression);

            // Investigation Screen
            renderEvidenceBoard();
            resetInvestigationUI();
            
            // Case Closed Screen
            document.getElementById('closed-expression').innerHTML = formatExpression(caseData.expression);
            document.getElementById('closed-solution').textContent = `(${caseData.solution.join(')(')})`;

            switchScreen('briefing');
        }

        function startGame() {
            switchScreen('investigation');
        }
        
        function formatExpression(expr) {
            return expr.replace(/x\^(\d)/g, "x<sup>$1</sup>").replace(/x(\d)/g, "x<sup>$1</sup>").replace(/x\²/g, "x²").replace(/x\³/g, "x³").replace(/x\⁴/g, "x⁴").replace(/\+/g, " + ").replace(/-/g, " - ");
        }

        function renderEvidenceBoard() {
            const board = document.getElementById('evidence-board');
            const expr = gameState.currentCase.expression;
            board.innerHTML = `<div class="term-tile p-2 rounded-lg" onclick="showClues()">${formatExpression(expr)}</div>`;
        }

        function showClues() {
            const cluePanel = document.getElementById('clue-panel');
            const { clues } = gameState.currentCase;
            cluePanel.innerHTML = ''; 

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
            cluePanel.innerHTML = clueHTML;
        }

        function inspectEvidence() {
            const cluePanel = document.getElementById('clue-panel');
            const { expression } = gameState.currentCase;
            
            // Normalize expression to easily split into terms
            const terms = expression.replace(/ - /g, ' + -').split(' + ');
            
            let inspectionHTML = `<div class="bg-gray-800 p-4 rounded-lg">
                <h3 class="font-bold text-xl mb-2">Inspection Results</h3>
                <div class="space-y-3">`;

            terms.forEach(term => {
                const match = term.match(/(-?\d*)?([a-zA-Z])?(\^|²|³|⁴)?(\d)?/);
                if (!match) return;

                let coeffPart = match[1];
                let variable = match[2] || '';
                let powerSymbol = match[3] || '';
                let powerNum = match[4] || '';
                
                let coeff = 1;
                if (coeffPart === '-') coeff = -1;
                else if (coeffPart) coeff = parseInt(coeffPart, 10);
                
                let power = 1;
                if (variable) {
                    if (powerSymbol === '^') power = parseInt(powerNum, 10);
                    else if (powerSymbol) power = fromSuperscript(powerSymbol);
                } else {
                    power = 0; // It's a constant
                }

                const numericFactors = getPrimeFactors(coeff);
                const variableFactors = [];
                for(let i=0; i < power; i++) {
                    variableFactors.push(variable);
                }
                
                const allFactors = [...numericFactors, ...variableFactors];
                if (allFactors.length === 0 && coeff !== 0) allFactors.push(coeff); // for constants like 1
                if (allFactors.length === 1 && Math.abs(allFactors[0]) === 1 && variableFactors.length > 0) {
                    allFactors.shift(); // remove 1 or -1 if there are variables
                    if (coeff < 0) allFactors.unshift(-1);
                }


                inspectionHTML += `
                    <div class="p-2 bg-gray-900 rounded">
                        <span class="font-bold text-lg">${formatExpression(term)}</span> &rarr; <span class="text-yellow-300">${allFactors.join(' &middot; ')}</span>
                    </div>
                `;
            });
            
            inspectionHTML += `</div></div>`;
            cluePanel.innerHTML = inspectionHTML;
        }

        function getPrimeFactors(num) {
            const factors = [];
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

        function addTerm(buttonEl) {
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
            
            updateDropZoneListeners(false); // Don't reset content
        }

        function removeTerm(buttonEl) {
            const factorGroup = buttonEl.closest('.factor-group');
            const termsContainer = factorGroup.querySelector('.terms-container');
            const dropZonesInGroup = Array.from(termsContainer.querySelectorAll('.drop-zone'));
            
            let targetToRemove = -1;

            // Find the last empty drop zone to remove
            for (let i = dropZonesInGroup.length - 1; i >= 0; i--) {
                // Fix for error on line 291: Property 'textContent' does not exist on type 'unknown'.
                if ((dropZonesInGroup[i] as HTMLElement).textContent === '?') {
                    targetToRemove = i;
                    break;
                }
            }

            // If no empty zone, find the last filled one (but don't remove the only one)
            if (targetToRemove === -1 && dropZonesInGroup.length > 1) {
                targetToRemove = dropZonesInGroup.length - 1;
            }
            
            if (targetToRemove !== -1) {
                // Remove the drop zone and its preceding operator
                // Fix for error on line 304: Property 'previousElementSibling' does not exist on type 'unknown'.
                const operator = (dropZonesInGroup[targetToRemove] as HTMLElement).previousElementSibling;
                termsContainer.removeChild(dropZonesInGroup[targetToRemove]);
                if (operator && operator.classList.contains('op')) {
                    termsContainer.removeChild(operator);
                }
                
                updateDropZoneListeners(false); // Don't reset content
            }
        }

        function checkAllFactorsFilled() {
            const allFilled = gameState.selectedFactors.every(factor => factor !== null);
            // Fix for error on line 316: Property 'disabled' does not exist on type 'HTMLElement'.
            (document.getElementById('validate-btn') as HTMLButtonElement).disabled = !allFilled;
        }

        function updateDropZoneListeners(resetContent = true) {
            const dropZones = document.querySelectorAll('.drop-zone');
            const newSelectedFactors = [];

            dropZones.forEach((zone, index) => {
                // Preserve existing content if not resetting
                if (!resetContent && zone.textContent !== '?') {
                    // Fix for error on line 326: Argument of type 'string' is not assignable to parameter of type 'number'.
                    const value = isNaN(Number(zone.textContent)) ? zone.textContent : Number(zone.textContent);
                    newSelectedFactors[index] = value;
                } else {
                    newSelectedFactors[index] = null;
                }

                if (resetContent) {
                    zone.textContent = '?';
                }

                // Remove old listeners to prevent duplicates
                const newZone = zone.cloneNode(true);
                zone.parentNode.replaceChild(newZone, zone);

                // Add data attribute for touch handling
                // Fix for error on line 341: Property 'dataset' does not exist on type 'Node'.
                (newZone as HTMLElement).dataset.zoneIndex = String(index);

                newZone.addEventListener('dragover', handleDragOver);
                newZone.addEventListener('dragleave', handleDragLeave);
                newZone.addEventListener('drop', (e) => handleDrop(e, index));
            });

            gameState.selectedFactors = newSelectedFactors;
            checkAllFactorsFilled();
        }

        function resetInvestigationUI() {
            document.getElementById('clue-panel').innerHTML = `<p class="text-gray-400 italic text-center">Click on the evidence or the inspection tool to begin.</p>`;
            document.getElementById('live-feedback-area').innerHTML = '';
            document.getElementById('interrogation-outline').innerHTML = `
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
            
            updateDropZoneListeners(true); // Reset content on new case
            
            document.getElementById('feedback-overlay').innerHTML = '';
            document.getElementById('feedback-overlay').classList.remove('show');
        }

        // --- DRAG & DROP LOGIC ---
        // Desktop D&D
        function handleDragStart(event, value) {
            gameState.draggedValue = value;
            event.dataTransfer.effectAllowed = 'move';
        }
        
        function handleDragOver(event) {
            event.preventDefault();
            event.target.classList.add('drag-over');
        }
        
        function handleDragLeave(event) {
            event.target.classList.remove('drag-over');
        }

        function handleDrop(event, zoneIndex) {
            event.preventDefault();
            const dropZone = event.target.closest('.drop-zone');
            if (!dropZone) return;

            dropZone.classList.remove('drag-over');
            
            if (gameState.draggedValue !== null) {
                const value = isNaN(gameState.draggedValue) ? gameState.draggedValue : Number(gameState.draggedValue);
                gameState.selectedFactors[zoneIndex] = value;
                dropZone.innerHTML = formatExpression(gameState.draggedValue.toString());
                gameState.draggedValue = null;
                checkAllFactorsFilled();
            }
        }

        // Mobile/Touch D&D
        function handleTouchStart(event, value, element) {
            if (event.cancelable) event.preventDefault();
            
            touchState.isDragging = true;
            touchState.draggedElement = element;
            gameState.draggedValue = value;

            element.classList.add('dragging');

            touchState.ghostElement = element.cloneNode(true);
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

        function handleTouchMove(event) {
            if (!touchState.isDragging) return;
            if (event.cancelable) event.preventDefault();

            const touch = event.touches[0];
            
            const ghostRect = touchState.ghostElement.getBoundingClientRect();
            touchState.ghostElement.style.left = `${touch.pageX - ghostRect.width / 2}px`;
            touchState.ghostElement.style.top = `${touch.pageY - ghostRect.height / 2}px`;

            touchState.ghostElement.style.display = 'none';
            const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
            touchState.ghostElement.style.display = '';

            const dropZone = elementUnder ? elementUnder.closest('.drop-zone') : null;

            if (touchState.lastTarget && touchState.lastTarget !== dropZone) {
                touchState.lastTarget.classList.remove('drag-over');
            }

            if (dropZone) {
                dropZone.classList.add('drag-over');
            }
            touchState.lastTarget = dropZone;
        }

        function handleTouchEnd(event) {
            if (!touchState.isDragging) return;

            if (touchState.lastTarget) {
                touchState.lastTarget.classList.remove('drag-over');
                const zoneIndex = parseInt(touchState.lastTarget.dataset.zoneIndex, 10);

                if (!isNaN(zoneIndex) && gameState.draggedValue !== null) {
                    const value = isNaN(gameState.draggedValue) ? gameState.draggedValue : Number(gameState.draggedValue);
                    gameState.selectedFactors[zoneIndex] = value;
                    touchState.lastTarget.innerHTML = formatExpression(gameState.draggedValue.toString());
                    checkAllFactorsFilled();
                }
            }

            if(touchState.draggedElement) touchState.draggedElement.classList.remove('dragging');
            if(touchState.ghostElement && touchState.ghostElement.parentNode) {
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


        // --- VALIDATION & PROGRESSION ---

        function fromSuperscript(sup) {
            const superscriptMap = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
            return superscriptMap[sup] || 1;
        }

        function parseFactor(terms) {
            const poly = new Map();
            terms.forEach(term => {
                if (term === null) return;

                if (typeof term === 'number') {
                    const key = 'const';
                    poly.set(key, (poly.get(key) || 0) + term);
                } else if (typeof term === 'string') {
                    let expr = term.toString();
                    const match = expr.match(/^(-?\d*)?([a-zA-Z])(\^(\d)|²|³|⁴)?$/);
                    if (!match) return;
                    
                    let coeffPart = match[1];
                    let variable = match[2];
                    let powerPart = match[3] ? (match[4] || fromSuperscript(match[3])) : '1';

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

        function multiplyPolynomials(poly1, poly2) {
            const result = new Map();
            if (poly1.size === 0) return poly2;
            if (poly2.size === 0) return poly1;

            for (const [term1, coeff1] of poly1.entries()) {
                for (const [term2, coeff2] of poly2.entries()) {
                    const newCoeff = coeff1 * coeff2;
                    const newTerms = new Map();

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

        function polyMapToString(poly) {
            if (poly.size === 0) return '0';

            const termStrings = [];
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
                    if (absCoeff !== 1 || term.length === 0) { // Show coeff if 1 and no variable
                         if (absCoeff !== 1 || term.split(':')[0].length === 0) termStr += absCoeff;
                    }
                    term.split(',').forEach(t => {
                        const [variable, power] = t.split(':');
                        termStr += variable;
                        if (power > 1) {
                            termStr += `<sup>${power}</sup>`;
                        }
                    });
                }
                termStrings.push(termStr);
            });

            return termStrings.join('');
        }

        function expressionToPolyMap(expr) {
            const poly = new Map();
            let exprWithCaret = expr.replace(/([a-zA-Z])([²³⁴])/g, (m, v, p) => `${v}^${fromSuperscript(p)}`)
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

        function diffPolyMaps(target, result) {
            const diff = {
                mismatched: [], // { term: 'x:1', targetCoeff: 5, resultCoeff: 4 }
                missing: [],    // { term: 'x:2', targetCoeff: 1 } (in target, not in result)
                extra: []       // { term: 'y:1', resultCoeff: 3 } (in result, not in target)
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

        function termToString(term, coeff) {
            if (coeff === 0) return '';
            let termStr = '';
            const absCoeff = Math.abs(coeff);

            if (term === 'const') {
                return coeff.toString();
            }
            
            if (coeff < 0) termStr += '-';

            if (absCoeff !== 1 || term.length === 0) {
                if(absCoeff !== 1 || term.split(':')[0].length === 0) termStr += absCoeff;
            }
            
            term.split(',').forEach(t => {
                const [variable, power] = t.split(':');
                termStr += variable;
                if (power > 1) {
                    termStr += `<sup>${power}</sup>`;
                }
            });
            
            if (termStr === '-') termStr += term.split(',')[0].split(':')[0]; 

            return termStr;
        }

        function validateSolution() {
            const { expression } = gameState.currentCase;
            const feedbackArea = document.getElementById('live-feedback-area');
            const feedbackOverlay = document.getElementById('feedback-overlay');
            
            const factorGroups = document.querySelectorAll('.factor-group');
            const factors = [];
            let globalDropZoneIndex = 0;
            
            factorGroups.forEach(group => {
                const terms = [];
                group.querySelectorAll('.drop-zone').forEach(() => {
                    terms.push(gameState.selectedFactors[globalDropZoneIndex]);
                    globalDropZoneIndex++;
                });
                factors.push(terms);
            });

            if (factors.some(f => f.some(t => t === null))) {
                feedbackArea.innerHTML = '<p class="text-yellow-400">Please fill all the empty slots.</p>';
                return;
            }
            
            let resultPoly;
            try {
                const polyFactors = factors.map(parseFactor);
                resultPoly = polyFactors.reduce((acc, poly) => multiplyPolynomials(acc, poly), new Map([['const', 1]]));
            } catch (e) {
                console.error("Validation error:", e);
                feedbackArea.innerHTML = '<p class="text-red-400">Error: Could not compute the product of your theory.</p>';
                return;
            }

            const targetPoly = expressionToPolyMap(expression);
            const diff = diffPolyMaps(targetPoly, resultPoly);

            let feedbackHTML = `<p>Your theory expands to: <span class="font-bold">${formatExpression(polyMapToString(resultPoly)) || '0'}</span></p>`;
            
            if (diff.mismatched.length === 0 && diff.missing.length === 0 && diff.extra.length === 0) {
                feedbackHTML += '<p class="text-green-400 font-bold mt-2">That matches the evidence perfectly! Case closed.</p>';
                feedbackArea.innerHTML = feedbackHTML;
                feedbackOverlay.innerHTML = '✅';
                feedbackOverlay.classList.add('show');
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
                feedbackArea.innerHTML = feedbackHTML;
                feedbackOverlay.innerHTML = '❌';
                feedbackOverlay.classList.add('show');
                setTimeout(() => feedbackOverlay.classList.remove('show'), 1000);
            }
        }

        function completeCase() {
            userProgress.solvedCaseIds.push(gameState.currentCase.id);
            
            if (checkForPatternDiscovery()) {
                setupPatternDiscovery();
                switchScreen('patternDiscovery');
            } else {
                switchScreen('caseClosed');
            }
        }

        function checkForPatternDiscovery() {
             const sumProductCasesSolved = caseFiles.filter(c => 
                c.patternId === 'sum-product' && userProgress.solvedCaseIds.includes(c.id)
            ).length;

            return sumProductCasesSolved >= 2 && !userProgress.discoveredPatterns['sum-product'];
        }

        function setupPatternDiscovery() {
            const examplesContainer = document.getElementById('pattern-examples');
            examplesContainer.innerHTML = '';
            const solvedCases = caseFiles.filter(c => userProgress.solvedCaseIds.includes(c.id) && c.patternId === 'sum-product');
            
            solvedCases.forEach(c => {
                const solution = `(${c.solution.join(')(')})`;
                examplesContainer.innerHTML += `
                    <p class="text-gray-700"><span class="font-bold">${formatExpression(c.expression)}</span> → You found the factors <span class="font-bold">${solution}</span>.</p>
                `;
            });
        }

        function savePattern() {
            // Fix for error on line 809: Property 'value' does not exist on type 'HTMLElement'.
            const userInput = (document.getElementById('pattern-input') as HTMLInputElement).value;
            if(userInput.trim().length > 10) {
                userProgress.discoveredPatterns['sum-product'] = userInput;
                switchScreen('caseClosed');
            } else {
                alert("Please describe the pattern in a bit more detail for your notebook!");
            }
        }

        function loadNextCase() {
            gameState.currentCaseIndex++;
            if (gameState.currentCaseIndex < caseFiles.length) {
                loadCase(caseFiles[gameState.currentCaseIndex]);
            } else {
                alert("You've solved all the available cases! Congratulations, Detective!");
                // Reset for replayability
                gameState.currentCaseIndex = 0;
                userProgress.solvedCaseIds = [];
                userProgress.discoveredPatterns = {};
                loadCase(caseFiles[0]);
            }
        }

        // --- INITIALIZATION ---
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
            handleTouchStart
        });

        window.onload = () => {
            loadCase(caseFiles[gameState.currentCaseIndex]);
        };