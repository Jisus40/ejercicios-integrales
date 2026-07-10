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
  checkProgressAndUnlock();
});

function animateEntry() {
  const elements = document.querySelectorAll('.main-header, .side-card, .levels-container, .global-progress, .main-footer');
  
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
// PROGRESO Y DESBLOQUEO
// =========================================================
function checkProgressAndUnlock() {
  const saved = localStorage.getItem('nivel0_progress');
  
  if (!saved) {
    // No hay progreso: todo bloqueado excepto Nivel 0, barra oculta
    return;
  }

  const data = JSON.parse(saved);
  const solved = data.solved ? data.solved.length : 0;
  const total = 52; // Total de ejercicios del nivel 0
  const percent = Math.round((solved / total) * 100);

  // Mostrar barra de progreso
  const progressSection = document.getElementById('globalProgress');
  const bar = document.getElementById('globalProgressBar');
  const text = document.getElementById('globalPercent');
  const msg = document.getElementById('progressMsg');

  if (progressSection) {
    progressSection.style.display = 'block';
    
    setTimeout(() => {
      if (bar) bar.style.width = percent + '%';
      if (text) text.textContent = percent + '%';
    }, 500);
  }

  // Si completó el 100%, desbloquear Nivel 1
  if (percent >= 100) {
    unlockLevel(1);
    
    if (msg) {
      msg.textContent = '🎉 ¡Felicidades! Has desbloqueado el Nivel 1. ¡Sigue así!';
      msg.style.color = 'var(--accent-success)';
    }
  } else {
    const remaining = total - solved;
    if (msg) {
      msg.textContent = `Te faltan ${remaining} ejercicios para desbloquear el Nivel 1`;
    }
  }
}

function unlockLevel(levelNum) {
  const card = document.getElementById(`level${levelNum}Card`);
  if (!card) return;

  // Convertir de bloqueado a disponible
  card.classList.remove('locked');
  card.classList.add('available');
  
  // Cambiar el contenido para que sea clickeable
  const lockIcon = card.querySelector('.level-lock');
  if (lockIcon) {
    lockIcon.classList.remove('level-lock');
    lockIcon.classList.add('level-arrow');
    lockIcon.textContent = '→';
  }

  const status = card.querySelector('.level-status');
  if (status) {
    status.textContent = '✅ Desbloqueado';
    status.style.background = 'rgba(80, 250, 123, 0.15)';
    status.style.color = 'var(--accent-success)';
  }

  const count = card.querySelector('.level-count');
  if (count) {
    count.textContent = 'Disponible';
  }

  // Hacer clickeable
  card.style.cursor = 'pointer';
  card.onclick = () => {
    // Por ahora alerta, luego cambiar al archivo del nivel correspondiente
    alert(`¡Nivel ${levelNum} próximamente! 🚀`);
  };

  // Agregar la barra lateral de color
  if (!card.querySelector('.level-bar')) {
    const bar = document.createElement('div');
    bar.className = 'level-bar';
    bar.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg, var(--accent-primary), var(--accent-secondary));border-radius:12px 0 0 12px;';
    card.insertBefore(bar, card.firstChild);
  }
}