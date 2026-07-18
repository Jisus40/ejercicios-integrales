// =========================================================
// MAPEO DE CORRECCION PARA KaTeX
// =========================================================
const LATEX_FIXES = {
  '\sen': '\sin',
  '\arcsen': '\arcsin',
  '\senh': '\sinh',
  '\tg': '\tan',
  '\ctg': '\cot',
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

// =========================================================
// CARGAR JSON
// =========================================================
async function loadLevelData() {
  try {
    const response = await fetch('nivel_3_completo.json');
    levelData = await response.json();

    let index = 0;
    levelData.subthemes.forEach(subtheme => {
      subtheme.exercises.forEach(ex => {
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
  const saved = localStorage.getItem('nivel3_progress');
  if (saved) {
    const data = JSON.parse(saved);
    solvedExercises = new Set(data.solved || []);
  }
}

function saveProgress() {
  localStorage.setItem('nivel3_progress', JSON.stringify({
    solved: Array.from(solvedExercises)
  }));

  // Si completó todos los ejercicios, marcar el nivel como completado
  if (solvedExercises.size === allExercises.length && allExercises.length > 0) {
    localStorage.setItem('nivel3_completed', 'true');
    localStorage.setItem('nivel3_completed_date', new Date().toISOString());
  }
}

// =========================================================
// INICIALIZAR UI
// =========================================================
function initUI() {
  document.getElementById('levelTitle').textContent = levelData.title;
  document.getElementById('levelDesc').textContent = levelData.description;
  document.getElementById('levelBadge').textContent = 'NIVEL 3';
}

// =========================================================
// NAVEGACION
// =========================================================
function renderExerciseNav() {
  const nav = document.getElementById('exerciseNav');
  nav.innerHTML = '';

  allExercises.forEach((ex, idx) => {
    const btn = document.createElement('button');
    btn.className = 'ex-btn';
    btn.textContent = idx + 1;
    btn.dataset.index = idx;

    if (idx === currentExIndex) {
      btn.classList.add('active');
    } else if (solvedExercises.has(ex.id)) {
      btn.classList.add('solved');
    }

    btn.onclick = () => loadExercise(idx);
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
    btn.classList.remove('active', 'solved');
    if (idx === index) btn.classList.add('active');
    else if (solvedExercises.has(allExercises[idx].id)) btn.classList.add('solved');
  });

  document.getElementById('statusText').textContent = `Ejercicio ${index + 1} de ${allExercises.length}`;

  // Definicion
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
    <span class="katex">$${ex.latex}$</span>
  `;

  // Pista
  document.getElementById('hintBox').innerHTML = `💡 <strong>Pista:</strong> ${renderLatexInText(ex.hint)}`;

  // Pasos de solucion - CORREGIDO: usar renderLatexInText en lugar de envolver todo en $...$
  const solutionContainer = document.getElementById('solutionSteps');
  solutionContainer.innerHTML = ex.solution_steps.map(step => `
    <div class="step">
      <div class="step-num">${step.step}</div>
      <div class="step-title">${step.title}</div>
      <div class="step-body">${renderLatexInText(step.body)}</div>
    </div>
  `).join('');

  // Tip del ejercicio
  const tipEl = document.getElementById('exerciseTip');
  if (ex.tip) {
    tipEl.innerHTML = `<strong>💡 Tip:</strong> ${renderLatexInText(ex.tip)}`;
  } else {
    tipEl.innerHTML = '';
  }

  // Justificacion guardada
  const savedJust = localStorage.getItem(`nivel3_justification_${ex.id}`);
  document.getElementById('justification').value = savedJust || '';
  buildCorrectionPreview(savedJust || '(Aún no has escrito una justificación)');

  // Renderizar KaTeX
  if (typeof renderMathInElement !== 'undefined') {
    setTimeout(() => renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ],
      throwOnError: false
    }), 50);
  }
}

function renderLatexInText(text) {
  if (!text) return '';
  return text.replace(/\$(.*?)\$/g, '<span class="katex">$$$1$$</span>');
}

// =========================================================
// RESET UI
// =========================================================
function resetExerciseUI() {
  document.getElementById('btnStart').style.display = 'inline-flex';
  document.getElementById('solutionSteps').classList.remove('visible');
  document.getElementById('selfCheckSection').classList.remove('visible');
  document.getElementById('exerciseTip').classList.remove('visible');

  // Resetear mensajes de auto-check
  document.getElementById('selfCheckMessageCorrect').style.display = 'none';
  document.getElementById('selfCheckMessageIncorrect').style.display = 'none';
}

// =========================================================
// VER SOLUCION
// =========================================================
function startSolution() {
  const btn = document.getElementById('btnStart');
  btn.style.display = 'none';

  document.getElementById('solutionSteps').classList.add('visible');
  document.getElementById('selfCheckSection').classList.add('visible');

  const ex = allExercises[currentExIndex];
  if (ex.tip) {
    document.getElementById('exerciseTip').classList.add('visible');
  }

  // Marcar como resuelto
  if (!solvedExercises.has(ex.id)) {
    solvedExercises.add(ex.id);
    saveProgress();
    renderExerciseNav();
  }

  setTimeout(() => {
    document.getElementById('selfCheckSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  if (typeof renderMathInElement !== 'undefined') {
    setTimeout(() => renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ],
      throwOnError: false
    }), 100);
  }
}

// =========================================================
// AUTO-CHECK
// =========================================================
function markCorrect() {
  document.getElementById('selfCheckMessageCorrect').style.display = 'block';
  document.getElementById('selfCheckMessageIncorrect').style.display = 'none';
}

function markIncorrect() {
  document.getElementById('selfCheckMessageCorrect').style.display = 'none';
  document.getElementById('selfCheckMessageIncorrect').style.display = 'block';
}

// =========================================================
// PISTA
// =========================================================
function toggleHint() {
  document.getElementById('hintBox').classList.toggle('visible');
}

// =========================================================
// JUSTIFICACION
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

  localStorage.setItem(`nivel3_justification_${ex.id}`, userText);

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
// CORRECCION IA
// =========================================================
function buildCorrectionPreview(userJustification) {
  const ex = allExercises[currentExIndex];
  const preview = document.getElementById('correctionPreview');

  const text = `═══════════════════════════════════════════════════════════════
  📐 CORRECCION DE EJERCICIO DE INTEGRALES
═══════════════════════════════════════════════════════════════

📊 NIVEL: ${levelData.title}
🔢 Ejercicio: ${currentExIndex + 1} de ${allExercises.length}
📚 TEMA: ${ex.subthemeName}
🆔 ID: ${ex.id}

───────────────────────────────────────────────────────────────
📖 DEFINICION RELEVANTE:
───────────────────────────────────────────────────────────────
${ex.subthemeDefinition}

───────────────────────────────────────────────────────────────
📝 ENUNCIADO:
───────────────────────────────────────────────────────────────
${ex.latex}

───────────────────────────────────────────────────────────────
📝 MI JUSTIFICACION:
───────────────────────────────────────────────────────────────
${userJustification}

───────────────────────────────────────────────────────────────
💡 PISTA DISPONIBLE:
───────────────────────────────────────────────────────────────
${ex.hint}

═══════════════════════════════════════════════════════════════
🤖 INSTRUCCION PARA LA IA:
Por favor, corrige mi justificación paso a paso. Indica si hay
errores conceptuales, de calculo o de notacion. Sugiere como
mejorar mi razonamiento.
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
// INICIALIZACION
// =========================================================
document.addEventListener("DOMContentLoaded", function() {
  loadLevelData();
});