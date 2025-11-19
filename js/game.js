const STORAGE_KEY = 'talent_journey_v1'

const LEVELS = [
  { lvl: 1, name: 'Abelha Estagiária', xp: 0 },
  { lvl: 2, name: 'Operário do Código', xp: 100 },
  { lvl: 3, name: 'Engenheiro da Colmeia', xp: 250 },
  { lvl: 4, name: 'Arquiteto do Néctar Digital', xp: 500 },
  { lvl: 5, name: 'Mestre Rainha Dev', xp: 900 }
]

const MISSIONS = [
  { id: 'quiz_vocacional', title: 'Complete o Quiz Vocacional', xp: 50, repeatable: false, url: '/quiz-vocacional' },
  { id: 'artigo_ux', title: 'Leia: O que faz um profissional de UX/UI?', xp: 20, repeatable: false, url: '/artigos/o-que-e-ux-ui' },
  { id: 'logica_mod1', title: 'Conclua o módulo: Lógica de Programação (intro)', xp: 100, repeatable: false, url: '/curso/logica-modulo-1' },
  { id: 'calc_js', title: 'Crie uma calculadora simples em JavaScript', xp: 150, repeatable: false, url: '/projeto/calc-js' },
  { id: 'primeiro_commit', title: 'Faça seu primeiro commit (Git) local', xp: 50, repeatable: true, capPerDay: 1, url: '/recurso/git-intro' },
  { id: 'mini_portfolio', title: 'Publique um mini portfólio (HTML/CSS)', xp: 120, repeatable: false, url: '/projeto/mini-portfolio' },
  { id: 'ajude_forum', title: 'Ajude alguém no fórum/discussão (deixe um feedback)', xp: 40, repeatable: true, capPerDay: 2, url: '/forum' },
  { id: 'grupo_estudos', title: 'Participe de um grupo de estudos (30min+)', xp: 70, repeatable: true, capPerWeek: 3, url: '/grupos-estudo' },
  { id: 'perfil_prof', title: 'Monte seu perfil com habilidades e interesses', xp: 30, repeatable: false, url: '/perfil/editar' },
  { id: 'sim_entrevista', title: 'Faça um simulado de entrevista (10 perguntas)', xp: 100, repeatable: false, url: '/simulado-entrevista' },
  { id: 'desafio_semana', title: 'Desafio da semana: um app de inclusão digital', xp: 300, repeatable: false, weekly: true, url: '/desafio-semanal' }
]

// const BADGE_DEFS = [
//   { id: 'first_mission', name: 'Primeira Missão', desc: 'Concluiu a primeira missão.', emoji: '🌟' },
//   { id: '500_xp', name: '500 XP', desc: 'Atingiu 500 XP no total.', emoji: '⚡' },
//   { id: 'streak_3', name: 'Persistência 3x', desc: 'Completou missões em 3 dias seguidos.', emoji: '🔥' },
//   { id: 'helper', name: 'Ajudante', desc: 'Ajudou colegas (3x no Social).', emoji: '🤝' },
//   { id: 'builder', name: 'Construtor', desc: 'Concluiu 3 missões de Prática.', emoji: '🛠️' }
// ]

const state = loadState() || {
  xp: 0,
  history: [],
  completed: {},
  badges: {},
  lastActiveDay: null,
  streakDays: 0,
  // NOVOS CAMPOS PARA O MASCOTE
  currentMascotMessage: "Muito prazer! Eu sou o Vovô Favo. Vamos transformar conhecimento em XP!",
  isMascotBubbleHidden: false
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function weekKey(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = dt.getUTCDay() || 7
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((dt - yearStart) / 86400000 + 1) / 7)
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function getLevel(xp) {
  let current = LEVELS[0], next = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
    }
  }
  return { current, next }
}

function formatRemaining(xp, next) {
  if (!next) return 'Você alcançou o topo da colmeia tecnológica. Agora é referência até para as abelhas devs!'
  return `Faltam ${next.xp - xp} XP para o próximo nível.`
}

function clampDailyWeekly(m, id) {
  const now = new Date()
  const thisWeek = weekKey(now)
  const thisDay = todayKey()
  const entries = state.history.filter(h => h.id === id)
  if (m.capPerDay) {
    const dayCount = entries.filter(h => h.day === thisDay).length
    if (dayCount >= m.capPerDay) return false
  }
  if (m.capPerWeek) {
    const weekCount = entries.filter(h => h.week === thisWeek).length
    if (weekCount >= m.capPerWeek) return false
  }
  return true
}

const elLevel = document.getElementById('level')
const elXpText = document.getElementById('xpText')
const elXpBar = document.getElementById('xpBar')
const elNext = document.getElementById('nextLabel')
const elBadges = document.getElementById('badges')
const elMissions = document.getElementById('missions')
const elMascotBubble = document.getElementById('mascotBubble')
const elCloseBubbleBtn = document.getElementById('closeBubbleBtn')

let typingTimeout

function typeWriter(element, text, speed = 25) {
  if (typingTimeout) clearTimeout(typingTimeout)

  element.innerHTML = ''
  let index = 0

  function step() {
    if (index >= text.length) return

    if (text[index] === '<') {
      const end = text.indexOf('>', index) + 1
      const fullTag = text.slice(index, end)
      element.innerHTML += fullTag
      index = end
      typingTimeout = setTimeout(step, speed)
    } else {
      element.innerHTML += text[index]
      index++
      typingTimeout = setTimeout(step, speed)
    }
  }

  step()
}

function setBubble(msg) {
  if (!elMascotBubble) return

  // 1. ATUALIZA E SALVA A NOVA MENSAGEM
  state.currentMascotMessage = msg;
  state.isMascotBubbleHidden = false; // Se uma nova mensagem é definida, o balão deve estar visível
  saveState();

  elMascotBubble.innerHTML = ''

  const closeBtnHTML = `
        <span id="closeBubbleBtn" class="close-bubble">
            <i data-lucide="x"></i> 
        </span>
    `
  elMascotBubble.insertAdjacentHTML('afterbegin', closeBtnHTML);

  const p = document.createElement('p')
  p.className = 'mb-0'
  elMascotBubble.appendChild(p)

  typeWriter(p, msg, 25)

  const newCloseBtn = document.getElementById('closeBubbleBtn');
  if (newCloseBtn) {
    newCloseBtn.addEventListener('click', () => {
      elMascotBubble.classList.add('hidden');
      // 2. SALVA O ESTADO ESCONDIDO
      state.isMascotBubbleHidden = true;
      saveState();
    });
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }

  elMascotBubble.classList.remove('mascot-pop')
  void elMascotBubble.offsetWidth
  elMascotBubble.classList.add('mascot-pop')
}

// BLOCO DE INICIALIZAÇÃO CORRIGIDO
if (elMascotBubble) {
  // Carrega a última mensagem salva, ou usa o conteúdo do HTML como fallback
  const initialText = state.currentMascotMessage || elMascotBubble.textContent.trim();
  setBubble(initialText);

  // Restaura o estado de visibilidade
  if (state.isMascotBubbleHidden) {
    elMascotBubble.classList.add('hidden');
  }
}

function renderLevel() {
  const { current, next } = getLevel(state.xp)
  elLevel.textContent = `${current.lvl} • ${current.name}`
  elXpText.textContent = `${state.xp} / ${next ? next.xp : state.xp}`
  const pct = next
    ? Math.max(0, Math.min(100, (state.xp - current.xp) / (next.xp - current.xp) * 100))
    : 100
  elXpBar.style.width = `${pct}%`
  elNext.textContent = formatRemaining(state.xp, next)
}

function missionCard(m) {
  const doneCount = state.completed[m.id] || 0;
  const isRepeatable = !!m.repeatable;
  const canDo = isRepeatable ? clampDailyWeekly(m, m.id) : doneCount === 0;

  const col = document.createElement('div');
  col.className = 'col-md-6 mission-card-col';

  const wrap = document.createElement('div');
  wrap.className = `card text-light shadow-sm rounded-3 overflow-hidden mission-card-wrap ${!canDo ? 'mission-completed' : ''}`;
  wrap.style.height = 'auto';

  let buttonContent;
  if (canDo) {
    buttonContent = `
            <button class="btn btn-sm btn-concluir" data-mission-id="${m.id}">
                Marcar como concluído
            </button>
        `;
  } else {
    buttonContent = `
            <div class="mission-icon-done">
                <i data-lucide="check-circle" class="lucide-check-circle"></i>
            </div>
        `;
  }

  wrap.innerHTML = `
        <a href="${m.url}" class="card-link-overlay text-decoration-none text-white">
            <img src="img/missoes/exemplo.png" class="card-img-top" style="height: 160px; object-fit: cover;">
        </a>
        <div class="card-body d-flex flex-column justify-content-between">
            <div>
                <a href="${m.url}" class="text-white text-decoration-none">
                    <h5 class="card-title">${m.title}</h5>
                </a>
                <p class="mb-2"><span class="badge">+${m.xp} XP</span></p>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-auto">
                <small class="text-white-50">
                    ${isRepeatable ? `Concluída ${doneCount}x` : (doneCount ? 'Concluída' : 'Disponível')}
                </small>
                ${buttonContent}
            </div>
        </div>
    `;

  if (canDo) {
    const button = wrap.querySelector('button');

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      completeMission(m);
    });
  }

  col.appendChild(wrap);
  return col;
}

function renderMissions() {
  elMissions.innerHTML = ''
  MISSIONS.forEach(m => elMissions.appendChild(missionCard(m)))
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons()
  }
}

function renderBadges() {
  elBadges.innerHTML = ''
  BADGE_DEFS.forEach(b => {
    const earned = !!state.badges[b.id]
    const span = document.createElement('span')
    span.className = 'relative tip inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-700 bg-slate-800/70'
    span.setAttribute('aria-label', b.name)
    span.textContent = b.emoji
    if (!earned) span.style.filter = 'grayscale(1) opacity(.6)'
    elBadges.appendChild(span)
  })
}

function renderFinalProject() {
  const finalBox = document.getElementById('final-project')
  if (!finalBox) return
  const completed = MISSIONS.every(m => (state.completed[m.id] || 0) > 0)

  if (!completed) {
    finalBox.innerHTML = `
        <div class="locked-box p-4 rounded-4 mb-5 text-center">
        <div class="d-flex justify-content-between align-items-center gap-2">
            <h4 class="mb-0">O Favo Mestre</h4>
            <i data-lucide="lock" class="lucide-lock"></i>
        </div>
</div>
        `
  } else {
    finalBox.innerHTML = `
    <div class="final-project-container position-relative final-project-unlocked">
        
        <div class="d-flex justify-content-between align-items-center p-3 final-project-header">
            <h5 class="mb-0 fw-bold ps-2">O FAVO MESTRE: Projeto de Portfólio (Website ONG)</h5>
            <div class="pe-2">
                <i data-lucide="unlock" class="lucide-unlock project-unlocked-icon"></i>
            </div>
        </div>

        <div class="p-4 final-project-body" id="project-stages-container">
            
            <div class="d-flex mb-2 mascot-stage-wrapper">
    <div class="mascot-img-container">
        <img src="img/abelha-de-oculos.png" width="130" class="stage-mascot"> 
    </div>
    
    <div class="p-3 rounded-3 text-dark shadow-sm stage-msg-box">
        <p class="mb-0 fw-semibold stage-msg-text">
            A coroa de sua jornada! Este é o seu teste de competência final. Conclua-o para iniciar seu portfólio profissional e chamar a atenção do mercado.
        </p>
    </div>
</div>

            <div class="rounded-4 overflow-hidden shadow-sm stage-card">
                <div class="p-3 d-flex align-items-center gap-2 stage-header">
                    <img src="img/favo.png" width="50" alt="ícone">
                    <h5 class="mb-0 title-etapas">ETAPA 1: Entenda o Desafio</h5>
                </div>

                <div class="p-4 stage-content">
                    <h6 class="fw-bold mb-2">Qual é o objetivo deste projeto?</h6>
                    <p class="mb-3 stage-text">
                        O seu desafio é criar um <strong>Website Institucional para uma ONG fictícia</strong>. Este é o seu projeto de portfólio que valida todas as suas habilidades essenciais em desenvolvimento front-end.
                    </p>
                    <h6 class="fw-bold mb-2">O que Esperamos?</h6>
                    <p class="mb-3 stage-text">
                         Um site completo com <strong>HTML</strong>, <strong>CSS</strong>, <strong>Flexbox</strong> e <strong>Design Responsivo</strong>. Deve incluir página inicial, menu, seção "Sobre", formulário de contato, e funcionar perfeitamente no celular.
                    </p>
                    <h6 class="fw-bold mb-3">Materiais de Apoio</h6>
                    <div class="d-flex flex-column gap-2 mb-4">
                        <a href="https://www.awwwards.com/websites/non-profit/" target="_blank" class="stage-resource-link">
    <i data-lucide="lightbulb" class="stage-link-icon"></i>
    <small class="mb-0 stage-link-text">Exemplo de projeto similar para inspiração. <br><strong>Link:</strong> Awwwards - Non-Profit</small>
</a>
<a href="https://roadmap.sh/frontend" target="_blank" class="stage-resource-link">
    <i data-lucide="folder" class="stage-link-icon"></i>
    <small class="mb-0 stage-link-text">Guia rápido de requisitos para portfólio. <br><strong>Link:</strong> Frontend Roadmap</small>
</a>
                    </div>

                    <button class="btn w-100 text-white fw-bold py-3 rounded-3 shadow-sm btn-start-project" 
                        onclick="renderProjectStage2()">
                        INICIAR PROJETO
                    </button>
                </div>
            </div>
        </div>
    </div>
`
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons()
  }
}

function renderProjectStage2() {
  const container = document.getElementById('project-stages-container');

  container.innerHTML = `
        <div class="d-flex mb-4 w-100">
            <img src="img/abelha-de-oculos.png" width="130" class="stage-mascot"> 
            <div class="p-3 rounded-3 text-dark shadow-sm stage-msg-box">
                <p class="mb-0 fw-semibold stage-msg-text">
                    Mãos à obra! Siga as instruções abaixo com atenção.
                </p>
            </div>
        </div>

        <div class="rounded-4 overflow-hidden shadow-sm stage-card">
            
            <div class="p-3 d-flex align-items-center gap-2 stage-header">
                <img src="/img/favo.png" width="50" alt="ícone">
                <h5 class="mb-0 title-etapas">ETAPA 2: Desenvolva o Projeto</h5>
            </div>

            <div class="p-4 stage-content">
                <h6 class="fw-bold mb-2 stage-title">Foco</h6>
                <p class="mb-4 stage-text">
                    Agora é com você! Dedique-se ao desenvolvimento do seu projeto. Lembre-se de aplicar tudo o que aprendeu.
                </p>

                <h6 class="fw-bold mb-2 stage-title">Dicas</h6>
                <ul class="mb-4 stage-list-text">
                    <li class="mb-2">O GitHub é seu currículo (Use desde o Dia 1)</li>
                    <li class="mb-2">O README.md é a "capa" do seu projeto</li>
                    <li class="mb-2">Peça ajuda em Fóruns Externos
                        <ul class="stage-sublist">
                            <li>O que você tentou fazer.</li>
                            <li>O código que você usou (um print ou link do GitHub).</li>
                            <li>Qual foi a mensagem de erro exata.</li>
                        </ul>
                    </li>
                    <li class="mb-2">Ative o "Modo Debug":
                        <ul class="stage-sublist">
                            <li>Seu código vai quebrar. Isso não é falha, é o processo. Use as ferramentas de desenvolvedor do seu navegador (clique com o botão direito > "Inspecionar") para ver os erros no "Console" e entender o que o navegador está tentando fazer.</li>
                        </ul>
                    </li>
                </ul>

                <button class="btn w-100 text-white fw-bold py-3 rounded-3 shadow-sm btn-start-project" 
                        onclick="renderProjectCompleted()">
                    JÁ DESENVOLVI MEU PROJETO
                </button>
            </div>
        </div>
    `;

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function renderProjectCompleted() {
  const container = document.getElementById('project-stages-container');

  container.innerHTML = `
    <div class="final-project-completed-card rounded-4 overflow-hidden shadow-sm completed-card-light">

        <div class="completed-body-light">
            
            <div class="completed-mascot-row-light">
                <img src="img/abelha-idoso-comemorando.webp" class="completed-mascot-light">
                <div class="completed-main-message-light">
                    <h4 class="fw-bold mb-2">Parabéns!</h4>
                    <p class="mb-0">
                        Seu comprometimento e talento te trouxeram até aqui. Este não é o fim, é o começo da sua nova carreira na tecnologia, repleta de oportunidades que você conquistou com as próprias mãos. O futuro é seu. Brilhe!
                    </p>
                </div>
            </div>

            <div class="completed-cert-box-light">
                <h5 class="fw-bold mb-3">Seu Certificado de Conclusão está pronto!</h5>
                <p class="mb-4">
                    Você concluiu seu primeiro projeto profissional "O Favo Mestre!" com sucesso! Este é um marco importante na sua jornada no MelWare.
                </p>
                <a href="./doc/Melware_certificado.pdf" download="Melware_certificado.pdf" 
                    class="btn-download-cert-light btn-download-cert-base" 
                   
                    <i data-lucide="download" class="cert-download-icon-light"></i>
                    BAIXAR CERTIFICADO DE CONCLUSÃO (PDF)
                </a>
            </div>
        </div>
    </div>
`;
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function updateStreakOnCompletion() {
  const today = todayKey()
  if (state.lastActiveDay === today) return
  if (!state.lastActiveDay) state.streakDays = 1
  else {
    const prev = new Date(state.lastActiveDay)
    const now = new Date(today)
    const diff = (now - prev) / 86400000
    state.streakDays = diff === 1 ? state.streakDays + 1 : 1
  }
  state.lastActiveDay = today
}

function checkBadges() {
  const award = id => {
    if (!state.badges[id]) state.badges[id] = new Date().toISOString()
  }
  const totalCompletions = Object.values(state.completed).reduce((a, b) => a + b, 0)
  if (totalCompletions >= 1) award('first_mission')
  if (state.xp >= 500) award('500_xp')
  if (state.streakDays >= 3) award('streak_3')
}

function completeMission(m) {
  if (m.repeatable && !clampDailyWeekly(m, m.id)) return

  const before = getLevel(state.xp).current.lvl

  state.xp += m.xp
  const now = new Date()
  state.history.push({
    id: m.id,
    ts: now.toISOString(),
    day: todayKey(),
    week: weekKey(now)
  })
  state.completed[m.id] = (state.completed[m.id] || 0) + 1

  updateStreakOnCompletion()
  checkBadges()
  saveState()
  renderAll()

  const allMissionsCompleted = MISSIONS.every(mission => (state.completed[mission.id] || 0) > 0)
  const after = getLevel(state.xp).current.lvl

  if (allMissionsCompleted) {
    const mascotImg = document.querySelector('.drop-shadow.bee-float')
    if (mascotImg) {
      mascotImg.src = 'img/abelha-idoso-comemorando.webp'
    }

    setBubble(`Parabéns, jovem gafanhoto! 🐝🎉 Você completou TODAS as missões! Agora mostre o que aprendeu e conquiste "O Favo Mestre"!`)

    const finalProjectSection = document.getElementById('final-project')
    if (finalProjectSection) {
      setTimeout(() => {
        finalProjectSection.scrollIntoView({ behavior: 'smooth' })
      }, 1500)
    }

  } else if (after > before) {
    setBubble(`Uau! Você alcançou o nível ${after} 🎉 Continue assim!`)
  } else {
    setBubble(`Missão concluída: “${m.title}”. +${m.xp} XP</span> 🚀`)
  }
}

function renderAll() {
  renderLevel()
  renderMissions()
  renderBadges()
  renderFinalProject()
}

document.addEventListener('DOMContentLoaded', () => {

  const bubble = document.getElementById('mascotBubble');
  const mascotImg = document.querySelector('.bee-wrapper img.bee-float');

  if (mascotImg && bubble) {
    mascotImg.addEventListener('click', () => {
      bubble.classList.remove('hidden');
      // 3. SALVA O ESTADO VISÍVEL
      state.isMascotBubbleHidden = false;
      saveState();
    });
  }
});

renderAll()