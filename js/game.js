console.log("game.js carregado!")

const STORAGE_KEY = 'talent_journey_v1'

const LEVELS = [
  { lvl: 1, name: 'Abelha Estagiária', xp: 0 },
  { lvl: 2, name: 'Operário do Código', xp: 100 },
  { lvl: 3, name: 'Engenheiro da Colmeia', xp: 250 },
  { lvl: 4, name: 'Arquiteto do Néctar Digital', xp: 500 },
  { lvl: 5, name: 'Mestre Rainha Dev', xp: 900 }
]

const MISSIONS = [
  { id: 'quiz_vocacional', title: 'Complete o Quiz Vocacional', xp: 50, repeatable: false },
  { id: 'artigo_ux', title: 'Leia: O que faz um profissional de UX/UI?', xp: 20, repeatable: false },
  { id: 'logica_mod1', title: 'Conclua o módulo: Lógica de Programação (intro)', xp: 100, repeatable: false },
  { id: 'calc_js', title: 'Crie uma calculadora simples em JavaScript', xp: 150, repeatable: false },
  { id: 'primeiro_commit', title: 'Faça seu primeiro commit (Git) local', xp: 50, repeatable: true, capPerDay: 1 },
  { id: 'mini_portfolio', title: 'Publique um mini portfólio (HTML/CSS)', xp: 120, repeatable: false },
  { id: 'ajude_forum', title: 'Ajude alguém no fórum/discussão (deixe um feedback)', xp: 40, repeatable: true, capPerDay: 2 },
  { id: 'grupo_estudos', title: 'Participe de um grupo de estudos (30min+)', xp: 70, repeatable: true, capPerWeek: 3 },
  { id: 'perfil_prof', title: 'Monte seu perfil com habilidades e interesses', xp: 30, repeatable: false },
  { id: 'sim_entrevista', title: 'Faça um simulado de entrevista (10 perguntas)', xp: 100, repeatable: false },
  { id: 'desafio_semana', title: 'Desafio da semana: um app de inclusão digital', xp: 300, repeatable: false, weekly: true }
]

const BADGE_DEFS = [
  { id: 'first_mission', name: 'Primeira Missão', desc: 'Concluiu a primeira missão.', emoji: '🌟' },
  { id: '500_xp', name: '500 XP', desc: 'Atingiu 500 XP no total.', emoji: '⚡' },
  { id: 'streak_3', name: 'Persistência 3x', desc: 'Completou missões em 3 dias seguidos.', emoji: '🔥' },
  { id: 'helper', name: 'Ajudante', desc: 'Ajudou colegas (3x no Social).', emoji: '🤝' },
  { id: 'builder', name: 'Construtor', desc: 'Concluiu 3 missões de Prática.', emoji: '🛠️' }
]

const state = loadState() || {
  xp: 0,
  history: [],
  completed: {},
  badges: {},
  lastActiveDay: null,
  streakDays: 0
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

  elMascotBubble.innerHTML = ''
  const p = document.createElement('p')
  p.className = 'mb-0'
  elMascotBubble.appendChild(p)

  typeWriter(p, msg, 25)

  elMascotBubble.classList.remove('mascot-pop')
  void elMascotBubble.offsetWidth
  elMascotBubble.classList.add('mascot-pop')
}

if (elMascotBubble) {
  const initialText = elMascotBubble.textContent.trim()
  elMascotBubble.innerHTML = ''
  const p = document.createElement('p')
  p.className = 'mb-0'
  elMascotBubble.appendChild(p)
  typeWriter(p, initialText, 30)
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
  const doneCount = state.completed[m.id] || 0
  const isRepeatable = !!m.repeatable
  const canDo = isRepeatable ? clampDailyWeekly(m, m.id) : doneCount === 0

  const col = document.createElement('div')
  col.className = 'col-md-6'

  const wrap = document.createElement('div')
  wrap.className = 'card bg-dark text-light border border-secondary shadow-sm rounded-4 overflow-hidden'
  wrap.style.height = 'auto'

  wrap.innerHTML = `
    <img src="img/missoes/exemplo.png" class="card-img-top" style="height: 160px; object-fit: cover;">
    <div class="card-body d-flex flex-column justify-content-between">
      <div>
        <h5 class="card-title">${m.title}</h5>
        <p class="mb-2"><span class="badge">+${m.xp} XP</span></p>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-auto">
        <small class="text-white-50">
          ${isRepeatable ? `Concluída ${doneCount}x` : (doneCount ? 'Concluída' : 'Disponível')}
        </small>
        <button class="btn btn-sm ${canDo ? 'btn-concluir' : 'btn-concluido'}"
          ${!canDo ? 'disabled' : ''}>
          ${canDo ? 'Marcar como oncluído' : (isRepeatable ? 'Limite diário/semana' : 'Já concluída')}
        </button>
      </div>
    </div>
  `

  wrap.querySelector('button').onclick = () => { if (canDo) completeMission(m) }

  col.appendChild(wrap)
  return col
}

function renderMissions() {
  elMissions.innerHTML = ''
  MISSIONS.forEach(m => elMissions.appendChild(missionCard(m)))
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
        <h4 class="mb-3">Projeto Final</h4>
        <div class="d-flex justify-content-center align-items-center gap-3">
          <span>Complete todas as missões para desbloquear</span>
          <img src="img/lock.png" width="32" />
        </div>
      </div>
    `
  } else {
    finalBox.innerHTML = `
      <div class="projeto-final-card p-4 rounded-4 mb-5">
        <h3 class="mb-3 fw-bold">Projeto Final: Website Interativo para ONG</h3>
        <div class="projeto-header d-flex align-items-start gap-3 mb-4">
          <img src="img/abelha-de-oculos.png" width="80" />
          <p class="msg p-3 rounded-3">
            É hora de mostrar seu talento...
          </p>
        </div>
      </div>
    `
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

  const after = getLevel(state.xp).current.lvl
  setBubble(after > before
    ? `Uau! Você alcançou o nível ${after} 🎉 Continue assim!`
    : `Missão concluída: “${m.title}”. +${m.xp} XP</span> 🚀`
  )
}

function renderAll() {
  renderLevel()
  renderMissions()
  renderBadges()
  renderFinalProject()
}

renderAll()
