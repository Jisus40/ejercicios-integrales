// =========================================================
// CONFIGURACIÓN DE SÍMBOLOS MATEMÁTICOS PARA LA BARRA DE HERRAMIENTAS
// =========================================================
const MATH_SYMBOLS = [
  { label: '∫', insert: '\\int', title: 'Integral' },
  { label: 'dx', insert: '\\, dx', title: 'Diferencial' },
  { label: '𝑥', insert: 'x', title: 'Variable x' },
  { label: '^', insert: '^', title: 'Potencia' },
  { label: '𝑎⁄𝑏', insert: '\\frac{}{}', title: 'Fracción' },
  { label: '⋅', insert: '\\cdot', title: 'Multiplicación' },
  { label: '+', insert: '+', title: 'Suma' },
  { label: '−', insert: '-', title: 'Resta' },
  { label: 'C', insert: 'C', title: 'Constante' },
  { label: '(', insert: '(', title: 'Paréntesis izq' },
  { label: ')', insert: ')', title: 'Paréntesis der' },
  { label: 'sen', insert: '\\sen', title: 'Seno' },
  { label: 'cos', insert: '\\cos', title: 'Coseno' },
  { label: 'tan', insert: '\\tan', title: 'Tangente' },
  { label: 'sec', insert: '\\sec', title: 'Secante' },
  { label: 'csc', insert: '\\csc', title: 'Cosecante' },
  { label: 'cot', insert: '\\cot', title: 'Cotangente' },
  { label: 'ln', insert: '\\ln', title: 'Logaritmo natural' },
  { label: 'eˣ', insert: 'e^{}', title: 'Exponencial' },
  { label: '√', insert: '\\sqrt{}', title: 'Raíz cuadrada' },
  { label: '∜', insert: '\\sqrt[4]{}', title: 'Raíz cuarta' },
  { label: '|x|', insert: '\\left| \\right|', title: 'Valor absoluto' },
  { label: 'π', insert: '\\pi', title: 'Pi' },
  { label: 'arcsen', insert: '\\arcsen', title: 'Arcoseno' },
  { label: 'arctan', insert: '\\arctan', title: 'Arcotangente' },
  { label: '□', insert: '\\boxed{}', title: 'Caja respuesta' },
  { label: '_', insert: '_', title: 'Subíndice' },
  { label: '{', insert: '{', title: 'Llave izq' },
  { label: '}', insert: '}', title: 'Llave der' },
  { label: '∞', insert: '\\infty', title: 'Infinito' },
];

// =========================================================
// ESTADO GLOBAL
// =========================================================
let levelData = null;          // Datos del JSON cargado
let allExercises = [];         // Array plano de todos los ejercicios
let currentExIndex = 0;        // Índice del ejercicio actual
let solvedExercises = new Set(); // IDs de ejercicios resueltos
let unlockedExercises = new Set(); // IDs de ejercicios desbloqueados

// =========================================================
// CARGAR JSON DEL NIVEL
// =========================================================
async function loadLevelData() {
  try {
    const response = await fetch('nivel_0_completo.json');
    levelData = await response.json();

    // Aplanar todos los ejercicios en un solo array
    let index = 0;
    levelData.subthemes.forEach(subtheme => {
      subtheme.exercises.forEach(ex => {
        allExercises.push({
          ...ex,
          subthemeName: subtheme.name,
          subthemeDefinition: subtheme.definition,
          subthemeTip: subtheme.tip,
          globalIndex: index++
        });
      });
    });

    // Cargar progreso guardado
    loadProgress();

    // Inicializar UI
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
// CARGAR/Guardar PROGRESO EN LOCALSTORAGE
// =========================================================
function loadProgress() {
  const saved = localStorage.getItem('nivel0_progress');
  if (saved) {
    const data = JSON.parse(saved);
    solvedExercises = new Set(data.solved || []);
    unlockedExercises = new Set(data.unlocked || []);
    // El primer ejercicio siempre está desbloqueado
    if (allExercises.length > 0) {
      unlockedExercises.add(allExercises[0].id);
    }
  } else {
    // Primer ejercicio desbloqueado por defecto
    if (allExercises.length > 0) {
      unlockedExercises.add(allExercises[0].id);
    }
  }
}

function saveProgress() {
  localStorage.setItem('nivel0_progress', JSON.stringify({
    solved: Array.from(solvedExercises),
    unlocked: Array.from(unlockedExercises)
  }));
}

// =========================================================
// INICIALIZAR UI (header, barra de herramientas)
// =========================================================
function initUI() {
  document.getElementById('levelTitle').textContent = levelData.title;
  document.getElementById('levelDesc').textContent = levelData.description;
  document.getElementById('levelBadge').textContent = 'NIVEL 0';

  // Generar botones de símbolos matemáticos
  const toolbar = document.getElementById('mathToolbar');
  toolbar.innerHTML = MATH_SYMBOLS.map(sym => `
    <button class="math-btn" onclick="insertSymbol('${sym.insert.replace(/'/g, "\\'")}')" title="${sym.title}">
      ${sym.label}
    </button>
  `).join('');
}

// =========================================================
// RENDERIZAR NAVEGACIÓN DE EJERCICIOS
// =========================================================
function renderExerciseNav() {
  const nav = document.getElementById('exerciseNav');
  nav.innerHTML = '';

  allExercises.forEach((ex, idx) => {
    const btn = document.createElement('button');
    btn.className = 'ex-btn';
    btn.textContent = idx + 1;
    btn.dataset.index = idx;

    // Estados
    if (idx === currentExIndex) {
      btn.classList.add('active');
    } else if (solvedExercises.has(ex.id)) {
      btn.classList.add('solved');
    } else if (unlockedExercises.has(ex.id)) {
      btn.classList.add('unlocked');
    }

    btn.onclick = () => loadExercise(idx);
    nav.appendChild(btn);
  });

  // Actualizar progreso
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
// CARGAR UN EJERCICIO ESPECÍFICO
// =========================================================
function loadExercise(index) {
  currentExIndex = index;
  const ex = allExercises[index];

  // Resetear estados de UI
  resetExerciseUI();

  // Actualizar navegación visual
  document.querySelectorAll('.ex-btn').forEach((btn, idx) => {
    btn.classList.remove('active', 'solved', 'unlocked');
    if (idx === index) btn.classList.add('active');
    else if (solvedExercises.has(allExercises[idx].id)) btn.classList.add('solved');
    else if (unlockedExercises.has(allExercises[idx].id)) btn.classList.add('unlocked');
  });

  // Actualizar barra de estado
  document.getElementById('statusText').textContent = `Ejercicio ${index + 1} de ${allExercises.length}`;

  // Cargar definición del subtema
  document.getElementById('defTitle').textContent = ex.subthemeName;
  document.getElementById('defSubtitle').textContent = 'Concepto fundamental';
  document.getElementById('defContent').innerHTML = `
    <p>${renderLatexInText(ex.subthemeDefinition)}</p>
    ${ex.subthemeTip ? `<div class="exercise-tip visible" style="margin-top:12px;"><strong>💡 Tip del subtema:</strong> ${renderLatexInText(ex.subthemeTip)}</div>` : ''}
  `;

  // Cargar ejercicio
  document.getElementById('exTitle').textContent = `Ejercicio ${index + 1} (${ex.id})`;
  document.getElementById('exSubtitle').textContent = `Dificultad: ${'⭐'.repeat(ex.difficulty)}`;
  document.getElementById('exStatement').innerHTML = `
    <p style="margin-bottom:12px;color:var(--text-muted);font-size:13px;">Resuelve la siguiente integral:</p>
    <span class="katex">\\(${ex.latex}\\)</span>
  `;

  // Cargar pista
  document.getElementById('hintBox').innerHTML = `💡 <strong>Pista:</strong> ${renderLatexInText(ex.hint)}`;

  // Generar pasos de solución (ocultos inicialmente)
  const solutionContainer = document.getElementById('solutionSteps');
  solutionContainer.innerHTML = ex.solution_steps.map((step, i) => `
    <div class="step">
      <div class="step-num">${step.step}</div>
      <div class="step-title">${step.title}</div>
      <div class="step-body"><span class="katex">\\(${step.body}\\)</span></div>
    </div>
  `).join('');

  // Cargar tip del ejercicio
  const tipEl = document.getElementById('exerciseTip');
  if (ex.tip) {
    tipEl.innerHTML = `<strong>💡 Tip:</strong> ${renderLatexInText(ex.tip)}`;
  } else {
    tipEl.innerHTML = '';
  }

  // Cargar justificación guardada
  const savedJust = localStorage.getItem(`justification_${ex.id}`);
  document.getElementById('justification').value = savedJust || '';
  buildCorrectionPreview(savedJust || '(Aún no has escrito una justificación)');

  // Re-renderizar KaTeX
  if (typeof renderMathInElement !== 'undefined') {
    setTimeout(() => renderMathInElement(document.body), 50);
  }
}

// =========================================================
// AUXILIAR: Renderizar LaTeX dentro de texto plano
// =========================================================
function renderLatexInText(text) {
  if (!text) return '';
  // Envolver $...$ en spans con clase katex para que auto-render los capture
  return text.replace(/\$(.*?)\$/g, '<span class="katex">\\($1\\)</span>');
}

// =========================================================
// RESETAR UI DEL EJERCICIO
// =========================================================
function resetExerciseUI() {
  document.getElementById('btnStart').style.display = 'inline-flex';
  document.getElementById('userSolutionSection').classList.remove('visible');
  document.getElementById('comparisonSection').classList.remove('visible');
  document.getElementById('solutionSteps').classList.remove('visible');
  document.getElementById('congratsBanner').classList.remove('visible');
  document.getElementById('exerciseTip').classList.remove('visible');
  document.getElementById('userSolutionInput').value = '';

  const userCard = document.getElementById('userCompareCard');
  const expectedCard = document.getElementById('expectedCompareCard');
  userCard.classList.remove('correct', 'wrong');
  expectedCard.classList.remove('correct', 'wrong');
}

// =========================================================
// INSERTAR SÍMBOLO EN EL TEXTAREA
// =========================================================
function insertSymbol(symbol) {
  const textarea = document.getElementById('userSolutionInput');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  // Si es \frac{}{}, posicionar cursor entre las primeras llaves
  if (symbol === '\\frac{}{}') {
    textarea.value = text.substring(0, start) + '\\frac{}{}' + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + 6;
    return;
  }
  if (symbol === '\\sqrt{}') {
    textarea.value = text.substring(0, start) + '\\sqrt{}' + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + 6;
    return;
  }
  if (symbol === '\\sqrt[4]{}') {
    textarea.value = text.substring(0, start) + '\\sqrt[4]{}' + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + 8;
    return;
  }
  if (symbol === '\\boxed{}') {
    textarea.value = text.substring(0, start) + '\\boxed{}' + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + 7;
    return;
  }
  if (symbol === 'e^{}') {
    textarea.value = text.substring(0, start) + 'e^{}' + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + 3;
    return;
  }
  if (symbol === '\\left| \\right|') {
    textarea.value = text.substring(0, start) + '\\left| \\right|' + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + 7;
    return;
  }

  textarea.value = text.substring(0, start) + symbol + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
}

// =========================================================
// INICIAR SOLUCIÓN
// =========================================================
function startSolution() {
  const btn = document.getElementById('btnStart');
  const userSection = document.getElementById('userSolutionSection');
  btn.style.display = 'none';
  userSection.classList.add('visible');
  document.getElementById('userSolutionInput').focus();
}

// =========================================================
// VERIFICAR SOLUCIÓN
// =========================================================
function verifySolution() {
  const userInput = document.getElementById('userSolutionInput').value.trim();
  if (!userInput) {
    alert('Escribe tu solución antes de verificar.');
    return;
  }

  const ex = allExercises[currentExIndex];
  const normalizedUser = normalizeAnswer(userInput);
  const normalizedExpected = normalizeAnswer(ex.final_answer);
  const isCorrect = normalizedUser === normalizedExpected;

  // Mostrar comparación
  const compareSection = document.getElementById('comparisonSection');
  const userCard = document.getElementById('userCompareCard');
  const resultBox = document.getElementById('compareResult');

  // Renderizar fórmulas con KaTeX
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

  // Mostrar tip del ejercicio
  const tipEl = document.getElementById('exerciseTip');
  if (ex.tip) tipEl.classList.add('visible');

  // Si es correcto y no estaba resuelto antes
  if (isCorrect && !solvedExercises.has(ex.id)) {
    solvedExercises.add(ex.id);

    // Desbloquear siguiente ejercicio
    const nextIdx = currentExIndex + 1;
    if (nextIdx < allExercises.length) {
      unlockedExercises.add(allExercises[nextIdx].id);
    }

    saveProgress();
    renderExerciseNav();

    // Mostrar felicitaciones
    document.getElementById('congratsBanner').classList.add('visible');

    // Marcar botón actual como solved
    const activeBtn = document.querySelector('.ex-btn.active');
    if (activeBtn) {
      activeBtn.classList.remove('active');
      activeBtn.classList.add('solved');
    }
  }

  // Scroll a la comparación
  setTimeout(() => {
    compareSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  // Re-renderizar KaTeX en la solución
  if (typeof renderMathInElement !== 'undefined') {
    setTimeout(() => renderMathInElement(document.body), 100);
  }
}

// =========================================================
// NORMALIZAR RESPUESTA PARA COMPARAR
// =========================================================
function normalizeAnswer(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '')           // quitar espacios
    .replace(/\\/g, '')             // quitar backslashes
    .replace(/\{|\}/g, '')          // quitar llaves
    .replace(/cdot/g, '')           // quitar \cdot
    .replace(/boxed/g, '')          // quitar \boxed
    .replace(/int/g, '')            // quitar \int
    .replace(/frac/g, '')           // quitar \frac
    .replace(/displaystyle/g, '')   // quitar \displaystyle
    .replace(/sen/g, 'sin')         // normalizar seno
    .replace(/,/g, '')              // quitar comas
    .replace(/\+/g, '')             // quitar signos +
    .replace(/c$/g, '')             // quitar C al final (constante opcional)
    .replace(/\+c$/g, '')           // quitar +C
    .replace(/\|/g, '')             // quitar barras de valor absoluto
    .replace(/left|right/g, '');    // quitar left/right
}

// =========================================================
// RENDERIZAR KaTeX DINÁMICAMENTE
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
// NAVEGACIÓN ENTRE EJERCICIOS
// =========================================================
function prevExercise() {
  if (currentExIndex > 0) {
    loadExercise(currentExIndex - 1);
  }
}

function nextExercise() {
  if (currentExIndex < allExercises.length - 1) {
    // Solo permitir avanzar si está desbloqueado
    const nextEx = allExercises[currentExIndex + 1];
    if (unlockedExercises.has(nextEx.id) || solvedExercises.has(allExercises[currentExIndex].id)) {
      loadExercise(currentExIndex + 1);
    } else {
      alert('Resuelve el ejercicio actual para desbloquear el siguiente.');
    }
  }
}

// =========================================================
// MOSTRAR / OCULTAR PISTA
// =========================================================
function toggleHint() {
  document.getElementById('hintBox').classList.toggle('visible');
}

// =========================================================
// GUARDAR JUSTIFICACIÓN
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
// CONSTRUIR PREVISUALIZACIÓN PARA CORRECCIÓN IA
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
// COPIAR AL PORTAPAPELES
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