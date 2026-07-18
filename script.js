// =========================================================
// FONDO ANIMADO: Orbes que siguen el mouse
// =========================================================
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.orb');
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  orbs.forEach((orb, index) => {
    const speed = (index + 1) * 25;
    const offsetX = (x - 0.5) * speed;
    const offsetY = (y - 0.5) * speed;

    orb.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
});

// =========================================================
// ANIMACIÓN DE ENTRADA
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  animateEntry();
  checkAllProgressAndUnlock();
});

function animateEntry() {
  const elements = document.querySelectorAll('.main-header, .side-card, .levels-container, .progress-section, .main-footer');

  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';

    setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

// =========================================================
// CONFIGURACIÓN DE NIVELES
// =========================================================
const LEVEL_CONFIG = {
  0: { total: 52, path: 'nivel_0/nivel_0.html' },
  1: { total: 62, path: 'nivel_1/nivel_1.html' },
  2: { total: 111, path: 'nivel_2/nivel_2.html' },
  3: { total: 134, path: 'nivel_3/nivel_3.html' }
};

// =========================================================
// PROGRESO Y DESBLOQUEO
// =========================================================
function checkAllProgressAndUnlock() {
  // Verificar progreso del Nivel 0
  const nivel0Data = getLevelProgress(0);
  updateProgressBar(0, nivel0Data);

  // Verificar si Nivel 0 está completado → desbloquear Nivel 1
  if (nivel0Data.completed) {
    unlockLevel(1);

    // Verificar progreso del Nivel 1
    const nivel1Data = getLevelProgress(1);
    updateProgressBar(1, nivel1Data);

    // Verificar si Nivel 1 está completado → desbloquear Nivel 2
    if (nivel1Data.completed) {
      unlockLevel(2);

      // Verificar progreso del Nivel 2
      const nivel2Data = getLevelProgress(2);
      updateProgressBar(2, nivel2Data);

      // Verificar si Nivel 2 está completado → desbloquear Nivel 3
      if (nivel2Data.completed) {
        unlockLevel(3);

        // Verificar progreso del Nivel 3
        const nivel3Data = getLevelProgress(3);
        updateProgressBar(3, nivel3Data);
      }
    }
  }
}

function getLevelProgress(levelNum) {
  const saved = localStorage.getItem(`nivel${levelNum}_progress`);
  const completedFlag = localStorage.getItem(`nivel${levelNum}_completed`) === 'true';

  if (!saved) {
    return { solved: 0, total: LEVEL_CONFIG[levelNum].total, percent: 0, completed: completedFlag };
  }

  const data = JSON.parse(saved);
  const solved = data.solved ? data.solved.length : 0;
  const total = LEVEL_CONFIG[levelNum].total;
  const percent = total > 0 ? Math.round((solved / total) * 100) : 0;

  // Considerar completado si la bandera está activa O si percent >= 100
  const completed = completedFlag || (total > 0 && percent >= 100);

  return { solved, total, percent, completed };
}

function updateProgressBar(levelNum, data) {
  const section = document.getElementById(`progressLevel${levelNum}`);
  const bar = document.getElementById(`barLevel${levelNum}`);
  const text = document.getElementById(`percentLevel${levelNum}`);
  const msg = document.getElementById(`msgLevel${levelNum}`);

  if (!section || !data.total) return;

  // Mostrar la sección de progreso
  section.style.display = 'block';

  setTimeout(() => {
    if (bar) bar.style.width = data.percent + '%';
    if (text) text.textContent = data.percent + '%';
  }, 500);

  // Actualizar mensaje
  if (msg) {
    if (data.completed) {
      if (levelNum === 0) {
        msg.textContent = '🎉 ¡Nivel 0 completado! El Nivel 1 está desbloqueado.';
        msg.style.color = 'var(--accent-success)';
      } else if (levelNum === 1) {
        msg.textContent = '🎉 ¡Nivel 1 completado! El Nivel 2 está desbloqueado.';
        msg.style.color = 'var(--accent-success)';
      } else if (levelNum === 2) {
        msg.textContent = '🎉 ¡Nivel 2 completado! El Nivel 3 está desbloqueado.';
        msg.style.color = 'var(--accent-success)';
      } else if (levelNum === 3) {
        msg.textContent = '🎉 ¡Nivel 3 completado! Has dominado todas las técnicas de integrales.';
        msg.style.color = 'var(--accent-success)';
      }
    } else {
      const remaining = data.total - data.solved;
      if (levelNum === 0) {
        msg.textContent = `Te faltan ${remaining} ejercicios para desbloquear el Nivel 1`;
      } else if (levelNum === 1) {
        msg.textContent = `Te faltan ${remaining} ejercicios para desbloquear el Nivel 2`;
      } else if (levelNum === 2) {
        msg.textContent = `Te faltan ${remaining} ejercicios para desbloquear el Nivel 3`;
      } else if (levelNum === 3) {
        msg.textContent = `Te faltan ${remaining} ejercicios para completar el Nivel 3`;
      }
    }
  }
}

function unlockLevel(levelNum) {
  const card = document.getElementById(`level${levelNum}Card`);
  if (!card) return;

  // Si ya está desbloqueado, no hacer nada
  if (card.classList.contains('available')) return;

  // Convertir de bloqueado a disponible
  card.classList.remove('locked');
  card.classList.add('available');

  // Cambiar el contenido para que sea clickeable
  const lockIcon = document.getElementById(`level${levelNum}Lock`);
  if (lockIcon) {
    lockIcon.classList.remove('level-lock');
    lockIcon.classList.add('level-arrow');
    lockIcon.textContent = '→';
  }

  const status = document.getElementById(`level${levelNum}Status`);
  if (status) {
    status.textContent = '✅ Desbloqueado';
    status.style.background = 'rgba(80, 250, 123, 0.15)';
    status.style.color = 'var(--accent-success)';
  }

  const count = document.getElementById(`level${levelNum}Count`);
  if (count) {
    count.textContent = 'Disponible';
  }

  // Hacer clickeable
  card.style.cursor = 'pointer';

  // Convertir el div en un enlace funcional
  const levelPath = LEVEL_CONFIG[levelNum].path;
  card.onclick = () => {
    window.location.href = levelPath;
  };

  // Agregar la barra lateral de color
  if (!card.querySelector('.level-bar')) {
    const bar = document.createElement('div');
    bar.className = 'level-bar';
    bar.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg, var(--accent-primary), var(--accent-secondary));border-radius:12px 0 0 12px;';
    card.insertBefore(bar, card.firstChild);
  }
}