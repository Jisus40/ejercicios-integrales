// =========================================================
// CONFIGURACIÓN DE SÍMBOLOS MATEMÁTICOS
// =========================================================
const MATH_SYMBOLS = [
  { label: '∫', latex: '\\int', display: '∫' },
  { label: 'dx', latex: '\\,dx', display: 'dx' },
  { label: '𝑥', latex: 'x', display: '𝑥' },
  { label: '𝑦', latex: 'y', display: '𝑦' },
  { label: '^', latex: '^', display: '^' },
  { label: '𝑎⁄𝑏', latex: '\\frac{}{}', display: '𝑎⁄𝑏', cursorOffset: 6 },
  { label: '⋅', latex: '\\cdot', display: '⋅' },
  { label: '+', latex: '+', display: '+' },
  { label: '−', latex: '-', display: '−' },
  { label: 'C', latex: 'C', display: 'C' },
  { label: '(', latex: '(', display: '(' },
  { label: ')', latex: ')', display: ')' },
  { label: 'sen', latex: '\\sin', display: 'sen' },
  { label: 'cos', latex: '\\cos', display: 'cos' },
  { label: 'tan', latex: '\\tan', display: 'tan' },
  { label: 'sec', latex: '\\sec', display: 'sec' },
  { label: 'csc', latex: '\\csc', display: 'csc' },
  { label: 'cot', latex: '\\cot', display: 'cot' },
  { label: 'ln', latex: '\\ln', display: 'ln' },
  { label: 'eˣ', latex: 'e^{}', display: 'eˣ', cursorOffset: 3 },
  { label: '√', latex: '\\sqrt{}', display: '√', cursorOffset: 6 },
  { label: '∜', latex: '\\sqrt[4]{}', display: '∜', cursorOffset: 8 },
  { label: '|x|', latex: '\\left| \\right|', display: '|x|', cursorOffset: 7 },
  { label: 'π', latex: '\\pi', display: 'π' },
  { label: 'arcsen', latex: '\\arcsin', display: 'arcsen' },
  { label: 'arctan', latex: '\\arctan', display: 'arctan' },
  { label: '□', latex: '\\boxed{}', display: '□', cursorOffset: 7 },
  { label: 'arccos', latex: '\\arccos', display: 'arccos' },
  { label: '∞', latex: '\\infty', display: '∞' },
  { label: 'θ', latex: '\\theta', display: 'θ' },
  { label: 'α', latex: '\\alpha', display: 'α' },
  { label: 'β', latex: '\\beta', display: 'β' },
  { label: '0', latex: '0', display: '0' },
  { label: '1', latex: '1', display: '1' },
  { label: '2', latex: '2', display: '2' },
  { label: '3', latex: '3', display: '3' },
  { label: '4', latex: '4', display: '4' },
  { label: '5', latex: '5', display: '5' },
  { label: '6', latex: '6', display: '6' },
  { label: '7', latex: '7', display: '7' },
  { label: '8', latex: '8', display: '8' },
  { label: '9', latex: '9', display: '9' },
];

// =========================================================
// MAPEO DE CORRECCIÓN PARA KaTeX (JSON usa \sen, KaTeX usa \sin)
// =========================================================
const LATEX_FIXES = {
  '\\sen': '\\sin',
  '\\arcsen': '\\arcsin',
  '\\senh': '\\sinh',
  '\\tg': '\\tan',
  '\\ctg': '\\cot',
};

function fixLatexForKatex(latex) {
  let fixed = latex;
  for (const [wrong, right] of Object.entries(LATEX_FIXES)) {
    fixed = fixed.replace(new RegExp(wrong.replace(/\\/g, '\\\\'), 'g'), right);
  }
  return fixed;
}

// =========================================================
// ESTADO GLOBAL
// =========================================================
let levelData = null;
let allExercises = [];
let currentExIndex = 0;
let solvedExercises = new Set();
let unlockedExercises = new Set();
let userLatexInput = ''; // Almacena el LaTeX crudo del usuario

// =========================================================
// CARGAR JSON
// =========================================================
async function loadLevelData() {
  try {
    const response = await fetch('nivel_0_completo.json');
    levelData = await response.json();

    let index = 0;
    levelData.subthemes.forEach(subtheme => {
      subtheme.exercises.forEach(ex => {
        // Corregir LaTeX en el JSON para que KaTeX lo renderice bien
        ex.latex = fixLatexForKatex(ex.latex);
        ex.hint = fixLatexForKatex(ex.hint);
        ex.final_answer = fixLatexForKatex(ex.final_answer);
        if (ex.tip) ex.tip = fixLatexForKatex(ex.tip);
        ex.solution_steps = ex.solution_steps.map(step => ({
          ...step,
          body: fixLatexForKatex(step.body)
        }));

        allExercises.push({
          ...ex,
          subthemeName: subtheme.name,
          subthemeDefinition: fixLatexForKatex(subtheme.definition),
          subthemeTip: subtheme.tip ? fixLatexForKatex(subtheme.tip) : '',
          globalIndex: index++
        });
      });
    });

    loadProgress();
    initUI();
    renderExerciseNav();
    loadExercise(0);

  } catch (error) {
    console.error('Error cargando el nivel:', error);
    document.getElementById('levelTitle').textContent = 'Error al cargar';
    document.getElementById('levelDesc').textContent = 'No se pudo cargar el archivo JSON';
  }
}

// =========================================================
// PROGRESO
// =========================================================
function loadProgress() {
  const saved = localStorage.getItem('nivel0_progress');
  if (saved) {
    const data = JSON.parse(saved);
    solvedExercises = new Set(data.solved || []);
    unlockedExercises = new Set(data.unlocked || []);
    if (allExercises.length > 0) unlockedExercises.add(allExercises[0].id);
  } else {
    if (allExercises.length > 0) unlockedExercises.add(allExercises[0].id);
  }
}

function saveProgress() {
  localStorage.setItem('nivel0_progress', JSON.stringify({
    solved: Array.from(solvedExercises),
    unlocked: Array.from(unlockedExercises)
  }));
}

// =========================================================
// INICIALIZAR UI
// =========================================================
function initUI() {
  document.getElementById('levelTitle').textContent = levelData.title;
  document.getElementById('levelDesc').textContent = levelData.description;
  document.getElementById('levelBadge').textContent = 'NIVEL 0';

  const toolbar = document.getElementById('mathToolbar');
  toolbar.innerHTML = MATH_SYMBOLS.map((sym, idx) => `
    <button class="math-btn" onclick="insertMathSymbol(${idx})" title="${sym.display}">
      ${sym.display}
    </button>
  `).join('');
}

// =========================================================
// NAVEGACIÓN
// =========================================================
function renderExerciseNav() {
  const nav = document.getElementById('exerciseNav');
  nav.innerHTML = '';

  allExercises.forEach((ex, idx) => {
    const btn = document.createElement('button');
    btn.className = 'ex-btn';
    btn.textContent = idx + 1;
    btn.dataset.index = idx;

    // Estados visuales
    if (idx === currentExIndex) {
      btn.classList.add('active');
    } else if (solvedExercises.has(ex.id)) {
      btn.classList.add('solved');
    } else if (unlockedExercises.has(ex.id)) {
      btn.classList.add('unlocked');
    }

    // BLOQUEAR clic si no está desbloqueado ni resuelto
    const isAccessible = (idx === currentExIndex) || 
                         solvedExercises.has(ex.id) || 
                         unlockedExercises.has(ex.id);
    
    if (!isAccessible) {
      btn.classList.add('locked');
      btn.style.cursor = 'not-allowed';
      btn.title = 'Completa los ejercicios anteriores para desbloquear';
    } else {
      btn.onclick = () => loadExercise(idx);
    }

    nav.appendChild(btn);
  });

  updateProgress();
}

function updateProgress() {
  const total = allExercises.length;
  const solved = solvedExercises.size;
  const percent = Math.round((solved / total) * 100);
  const circle = document.getElementById('progressCircle');
  const circumference = 163.36;
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  document.getElementById('progressText').textContent = percent + '%';
}

// =========================================================
// CARGAR EJERCICIO
// =========================================================
function loadExercise(index) {
  currentExIndex = index;
  const ex = allExercises[index];
  resetExerciseUI();

  document.querySelectorAll('.ex-btn').forEach((btn, idx) => {
    btn.classList.remove('active', 'solved', 'unlocked');
    if (idx === index) btn.classList.add('active');
    else if (solvedExercises.has(allExercises[idx].id)) btn.classList.add('solved');
    else if (unlockedExercises.has(allExercises[idx].id)) btn.classList.add('unlocked');
  });

  document.getElementById('statusText').textContent = `Ejercicio ${index + 1} de ${allExercises.length}`;

  // Definición
  document.getElementById('defTitle').textContent = ex.subthemeName;
  document.getElementById('defSubtitle').textContent = 'Concepto fundamental';
  document.getElementById('defContent').innerHTML = `
    <p>${renderLatexInText(ex.subthemeDefinition)}</p>
    ${ex.subthemeTip ? `<div class="exercise-tip visible" style="margin-top:12px;"><strong>💡 Tip del subtema:</strong> ${renderLatexInText(ex.subthemeTip)}</div>` : ''}
  `;

  // Ejercicio
  document.getElementById('exTitle').textContent = `Ejercicio ${index + 1} (${ex.id})`;
  document.getElementById('exSubtitle').textContent = `Dificultad: ${'⭐'.repeat(ex.difficulty)}`;
  document.getElementById('exStatement').innerHTML = `
    <p style="margin-bottom:12px;color:var(--text-muted);font-size:13px;">Resuelve la siguiente integral:</p>
    <span class="katex">\\(${ex.latex}\\)</span>
  `;

  // Pista
  document.getElementById('hintBox').innerHTML = `💡 <strong>Pista:</strong> ${renderLatexInText(ex.hint)}`;

  // Pasos de solución
  const solutionContainer = document.getElementById('solutionSteps');
  solutionContainer.innerHTML = ex.solution_steps.map(step => `
    <div class="step">
      <div class="step-num">${step.step}</div>
      <div class="step-title">${step.title}</div>
      <div class="step-body"><span class="katex">\\(${step.body}\\)</span></div>
    </div>
  `).join('');

  // Tip del ejercicio
  const tipEl = document.getElementById('exerciseTip');
  if (ex.tip) {
    tipEl.innerHTML = `<strong>💡 Tip:</strong> ${renderLatexInText(ex.tip)}`;
  } else {
    tipEl.innerHTML = '';
  }

  // Justificación guardada
  const savedJust = localStorage.getItem(`justification_${ex.id}`);
  document.getElementById('justification').value = savedJust || '';
  buildCorrectionPreview(savedJust || '(Aún no has escrito una justificación)');

  // Renderizar KaTeX
  if (typeof renderMathInElement !== 'undefined') {
    setTimeout(() => renderMathInElement(document.body), 50);
  }
}

function renderLatexInText(text) {
  if (!text) return '';
  return text.replace(/\$(.*?)\$/g, '<span class="katex">\\($1\\)</span>');
}

// =========================================================
// RESET UI
// =========================================================
function resetExerciseUI() {
  document.getElementById('btnStart').style.display = 'inline-flex';
  document.getElementById('userSolutionSection').classList.remove('visible');
  document.getElementById('comparisonSection').classList.remove('visible');
  document.getElementById('solutionSteps').classList.remove('visible');
  document.getElementById('congratsBanner').classList.remove('visible');
  document.getElementById('exerciseTip').classList.remove('visible');

  // Limpiar editor
  userLatexInput = '';
  document.getElementById('mathInputHidden').value = '';
  document.getElementById('mathVisualEditor').innerHTML = '<span class="math-placeholder">Haz clic en los símbolos de arriba para construir tu respuesta...</span>';

  const userCard = document.getElementById('userCompareCard');
  const expectedCard = document.getElementById('expectedCompareCard');
  userCard.classList.remove('correct', 'wrong');
  expectedCard.classList.remove('correct', 'wrong');
}

// =========================================================
// EDITOR MATEMÁTICO VISUAL (sin mostrar LaTeX al usuario)
// =========================================================

function insertMathSymbol(symbolIndex) {
  const symbol = MATH_SYMBOLS[symbolIndex];
  const visualEditor = document.getElementById('mathVisualEditor');
  const hiddenInput = document.getElementById('mathInputHidden');

  // Ocultar placeholder
  const placeholder = visualEditor.querySelector('.math-placeholder');
  if (placeholder) placeholder.remove();

  // Para fracción y otros con llaves, necesitamos manejar la posición del cursor
  // Pero como no hay cursor real (es visual), simplificamos:
  // Insertamos el LaTeX y dejamos que el usuario continúe construyendo
  
  userLatexInput += symbol.latex;
  hiddenInput.value = userLatexInput;

  renderMathVisualEditor();
}

function renderMathVisualEditor() {
  const visualEditor = document.getElementById('mathVisualEditor');

  if (!userLatexInput.trim()) {
    visualEditor.innerHTML = '<span class="math-placeholder">Haz clic en los símbolos de arriba para construir tu respuesta...</span>';
    return;
  }

  try {
    if (typeof katex !== 'undefined') {
      visualEditor.innerHTML = katex.renderToString(userLatexInput, {
        throwOnError: false,
        displayMode: true
      });
    } else {
      visualEditor.textContent = userLatexInput;
    }
  } catch (e) {
    visualEditor.innerHTML = '<span style="color:var(--accent-danger);font-size:14px;">⚠️ Error en la expresión</span>';
  }
}

function clearMathEditor() {
  userLatexInput = '';
  document.getElementById('mathInputHidden').value = '';
  renderMathVisualEditor();
}

function backspaceMathEditor() {
  // Eliminar el último comando LaTeX o carácter
  // Esto es complejo; simplificamos eliminando el último carácter por ahora
  userLatexInput = userLatexInput.slice(0, -1);
  document.getElementById('mathInputHidden').value = userLatexInput;
  renderMathVisualEditor();
}

// =========================================================
// INICIAR SOLUCIÓN
// =========================================================
function startSolution() {
  const btn = document.getElementById('btnStart');
  const userSection = document.getElementById('userSolutionSection');
  btn.style.display = 'none';
  userSection.classList.add('visible');
  clearMathEditor();
}

// =========================================================
// VERIFICAR SOLUCIÓN
// =========================================================
function verifySolution() {
  const userInput = userLatexInput.trim();
  if (!userInput) {
    alert('Construye tu solución usando los botones de símbolos antes de verificar.');
    return;
  }

  const ex = allExercises[currentExIndex];
  const normalizedUser = normalizeAnswer(userInput);
  const normalizedExpected = normalizeAnswer(ex.final_answer);
  const isCorrect = normalizedUser === normalizedExpected;

  const compareSection = document.getElementById('comparisonSection');
  const userCard = document.getElementById('userCompareCard');
  const resultBox = document.getElementById('compareResult');

  renderKatexInElement(document.getElementById('userCompareText'), userInput);
  renderKatexInElement(document.getElementById('expectedCompareText'), ex.final_answer);

  if (isCorrect) {
    userCard.classList.add('correct');
    userCard.classList.remove('wrong');
    resultBox.className = 'compare-result success';
    resultBox.innerHTML = '✅ ¡Correcto! Tu solución coincide con la esperada.';
  } else {
    userCard.classList.add('wrong');
    userCard.classList.remove('correct');
    resultBox.className = 'compare-result fail';
    resultBox.innerHTML = '❌ Tu solución no coincide. Revisa los pasos de la solución a continuación.';
  }

  compareSection.classList.add('visible');
  document.getElementById('solutionSteps').classList.add('visible');

  const tipEl = document.getElementById('exerciseTip');
  if (ex.tip) tipEl.classList.add('visible');

  if (isCorrect && !solvedExercises.has(ex.id)) {
    solvedExercises.add(ex.id);
    const nextIdx = currentExIndex + 1;
    if (nextIdx < allExercises.length) {
      unlockedExercises.add(allExercises[nextIdx].id);
    }
    saveProgress();
    renderExerciseNav();
    document.getElementById('congratsBanner').classList.add('visible');
    const activeBtn = document.querySelector('.ex-btn.active');
    if (activeBtn) {
      activeBtn.classList.remove('active');
      activeBtn.classList.add('solved');
    }
  }

  setTimeout(() => {
    compareSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  if (typeof renderMathInElement !== 'undefined') {
    setTimeout(() => renderMathInElement(document.body), 100);
  }
}

// =========================================================
// NORMALIZAR RESPUESTA
// =========================================================
function normalizeAnswer(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\\/g, '')
    .replace(/\{|\}/g, '')
    .replace(/cdot/g, '')
    .replace(/boxed/g, '')
    .replace(/int/g, '')
    .replace(/frac/g, '')
    .replace(/displaystyle/g, '')
    .replace(/sin/g, 'sen')
    .replace(/arcsin/g, 'arcsen')
    .replace(/,/g, '')
    .replace(/\+/g, '')
    .replace(/c$/g, '')
    .replace(/\+c$/g, '')
    .replace(/\|/g, '')
    .replace(/left|right/g, '');
}

// =========================================================
// RENDERIZAR KaTeX
// =========================================================
function renderKatexInElement(element, latex) {
  try {
    if (typeof katex !== 'undefined') {
      element.innerHTML = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false
      });
    } else {
      element.textContent = latex;
    }
  } catch (e) {
    element.textContent = latex;
  }
}

// =========================================================
// NAVEGACIÓN
// =========================================================
function prevExercise() {
  if (currentExIndex > 0) loadExercise(currentExIndex - 1);
}

function nextExercise() {
  if (currentExIndex < allExercises.length - 1) {
    const nextEx = allExercises[currentExIndex + 1];
    if (unlockedExercises.has(nextEx.id) || solvedExercises.has(allExercises[currentExIndex].id)) {
      loadExercise(currentExIndex + 1);
    } else {
      alert('Resuelve el ejercicio actual para desbloquear el siguiente.');
    }
  }
}

// =========================================================
// PISTA
// =========================================================
function toggleHint() {
  document.getElementById('hintBox').classList.toggle('visible');
}

// =========================================================
// JUSTIFICACIÓN
// =========================================================
function saveJustification() {
  const textarea = document.getElementById('justification');
  const userText = textarea.value.trim();
  const ex = allExercises[currentExIndex];

  if (userText === '') {
    textarea.style.borderColor = '#ff5555';
    setTimeout(() => textarea.style.borderColor = '', 1000);
    return;
  }

  localStorage.setItem(`justification_${ex.id}`, userText);

  const btn = document.querySelector('.btn-save');
  const originalText = btn.innerHTML;
  btn.innerHTML = '✅ Guardado';
  btn.style.background = '#50fa7b';
  buildCorrectionPreview(userText);

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = '';
  }, 2000);
}

// =========================================================
// CORRECCIÓN IA
// =========================================================
function buildCorrectionPreview(userJustification) {
  const ex = allExercises[currentExIndex];
  const preview = document.getElementById('correctionPreview');

  const text = `═══════════════════════════════════════════════════════════════
  📐 CORRECCIÓN DE EJERCICIO DE INTEGRALES
═══════════════════════════════════════════════════════════════

📊 NIVEL: ${levelData.title}
🔢 Ejercicio: ${currentExIndex + 1} de ${allExercises.length}
📚 TEMA: ${ex.subthemeName}
🆔 ID: ${ex.id}

───────────────────────────────────────────────────────────────
📖 DEFINICIÓN RELEVANTE:
───────────────────────────────────────────────────────────────
${ex.subthemeDefinition}

───────────────────────────────────────────────────────────────
✏️ ENUNCIADO:
───────────────────────────────────────────────────────────────
${ex.latex}

───────────────────────────────────────────────────────────────
📝 MI RESPUESTA:
───────────────────────────────────────────────────────────────
${userLatexInput || '(No se ingresó respuesta)'}

───────────────────────────────────────────────────────────────
📝 MI JUSTIFICACIÓN:
───────────────────────────────────────────────────────────────
${userJustification}

───────────────────────────────────────────────────────────────
💡 PISTA DISPONIBLE:
───────────────────────────────────────────────────────────────
${ex.hint}

═══════════════════════════════════════════════════════════════
🤖 INSTRUCCIÓN PARA LA IA:
Por favor, corrige mi justificación paso a paso. Indica si hay
errores conceptuales, de cálculo o de notación. Sugiere cómo
mejorar mi razonamiento y dime si mi respuesta final es correcta.
═══════════════════════════════════════════════════════════════`;

  preview.textContent = text;
}

// =========================================================
// COPIAR
// =========================================================
async function copyToClipboard() {
  const preview = document.getElementById('correctionPreview');
  const text = preview.textContent;
  const btn = document.getElementById('btnCopy');

  try {
    await navigator.clipboard.writeText(text);
    btn.innerHTML = '✅ ¡Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = '📋 Copiar Todo';
      btn.classList.remove('copied');
    }, 2500);
  } catch (err) {
    const t = document.createElement('textarea');
    t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); document.execCommand('copy');
    document.body.removeChild(t);
    btn.innerHTML = '✅ ¡Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = '📋 Copiar Todo';
      btn.classList.remove('copied');
    }, 2500);
  }
}

// =========================================================
// INICIALIZACIÓN
// =========================================================
document.addEventListener("DOMContentLoaded", function() {
  loadLevelData();
});