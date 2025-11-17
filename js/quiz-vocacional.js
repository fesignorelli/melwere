document.addEventListener("DOMContentLoaded", function () {
    const STORAGE_KEY = "melware_quiz_resultado"
    const JORNADA_KEY = "melware_quiz_jornada_iniciada"

    const perguntas = [
        {
            texto: "O que mais te atrai ao começar um projeto?",
            opcoes: [
                { texto: "Criar interfaces bonitas e intuitivas", pontua: ["uxui", "frontend"] },
                { texto: "Fazer a lógica por trás das funcionalidades", pontua: ["backend", "infra"] },
                { texto: "Transformar tudo isso em um app de bolso", pontua: ["mobile"] },
                { texto: "Analisar os dados e tomar decisões", pontua: ["dados"] }
            ]
        },
        {
            texto: "Qual dessas tarefas parece mais legal?",
            opcoes: [
                { texto: "Prototipar uma tela no Figma", pontua: ["uxui"] },
                { texto: "Construir uma API", pontua: ["backend"] },
                { texto: "Criar uma animação interativa", pontua: ["frontend"] },
                { texto: "Subir um app Android/iOS na loja", pontua: ["mobile"] }
            ]
        },
        {
            texto: "Como você prefere trabalhar?",
            opcoes: [
                { texto: "Com foco em design e experiência", pontua: ["uxui", "frontend"] },
                { texto: "De forma analítica e lógica", pontua: ["backend", "dados", "seguranca"] },
                { texto: "Com foco em gestão e organização", pontua: ["gestao"] },
                { texto: "Com ferramentas de automação e cloud", pontua: ["infra", "seguranca"] }
            ]
        },
        {
            texto: "Qual dessas ferramentas/linguagens você gostaria de aprender primeiro?",
            opcoes: [
                { texto: "HTML/CSS/JS", pontua: ["frontend"] },
                { texto: "Java, C# ou Python", pontua: ["backend", "dados"] },
                { texto: "Flutter ou React Native", pontua: ["mobile"] },
                { texto: "Figma", pontua: ["uxui"] }
            ]
        },
        {
            texto: "Você se imagina mais:",
            opcoes: [
                { texto: "Criando layouts", pontua: ["uxui", "frontend"] },
                { texto: "Codando regras de negócio", pontua: ["backend"] },
                { texto: "Pensando na estrutura do banco de dados", pontua: ["dados", "backend"] },
                { texto: "Lidando com equipes e entregas", pontua: ["gestao"] }
            ]
        }
    ]

    const score = {
        frontend: 0,
        backend: 0,
        mobile: 0,
        uxui: 0,
        dados: 0,
        seguranca: 0,
        gestao: 0,
        infra: 0
    }

    let indicePergunta = 0
    const respostasUsuario = []
    let selecaoAtual = null

    function mostrarPergunta() {
        selecaoAtual = null
        const container = document.querySelector("#quiz-container")
        const perguntaAtual = perguntas[indicePergunta]
        const totalPerguntas = perguntas.length
        const progresso = ((indicePergunta + 1) / totalPerguntas) * 100

        container.innerHTML = `
      <div class="quiz-card text-white">

        <!-- Barra de Progresso -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="flex-grow-1 me-3">
            <div class="progress" style="height: 8px; background-color: rgba(255,255,255,0.15);">
              <div class="progress-bar" role="progressbar"
                   style="width: ${progresso}%; background-color: #facc15;"></div>
            </div>
          </div>
        </div>

        <!-- Texto Questão X/Y -->
        <p class="text-center fw-bold mb-2">
          Questão ${indicePergunta + 1}/${totalPerguntas}
        </p>

        <!-- Pergunta -->
        <p class="d-flex justify-content-center fw-bold mb-4 text-center">
          ${perguntaAtual.texto}
        </p>

        <div id="opcoes">
          ${perguntaAtual.opcoes
                .map(
                    (opcao, index) => `
              <div class="opcao d-flex align-items-center" onclick="selecionar(${index})">
                <img src="img/favo.png" class="me-2 favo-icon" alt="favo"> ${opcao.texto}
              </div>
            `
                )
                .join("")}
        </div>

        <div class="mt-4 d-flex justify-content-between mb-2">
          <img src="img/btn-voltar.png" alt="Voltar" class="btn-nav"
               onclick="voltarPergunta()"
               style="cursor:pointer; ${indicePergunta === 0 ? "opacity: 0.5; pointer-events: none;" : ""}" />

          <img src="img/btn-avancar.png" alt="Avançar" class="btn-nav" id="btn-avancar"
               style="cursor:pointer; opacity: 0.5; pointer-events: none;"
               onclick="confirmarResposta()" />
        </div>

        <a href="#" id="pular-quiz-link" class="link-pular-quiz">Já sabe sua vocação? Pule o quiz aqui!</a>
      </div>
    `

        const avancarBtn = document.getElementById("btn-avancar")
        if (avancarBtn) {
            avancarBtn.addEventListener("mouseenter", () => (avancarBtn.style.transform = "translateY(-3px)"))
            avancarBtn.addEventListener("mouseleave", () => (avancarBtn.style.transform = "translateY(0)"))
        }

        const pularLink = document.getElementById("pular-quiz-link")
        if (pularLink) {
            pularLink.addEventListener("click", function (e) {
                e.preventDefault()
                iniciarJornada()
            })
        }
    }


    window.selecionar = function (index) {
        selecaoAtual = perguntas[indicePergunta].opcoes[index]
        const opcoes = document.querySelectorAll(".opcao")
        opcoes.forEach((el, i) => {
            const img = el.querySelector("img.favo-icon")
            if (i === index) {
                el.classList.add("opcao-selecionada")
                img.src = "img/favo-select.png"
            } else {
                el.classList.remove("opcao-selecionada")
                img.src = "img/favo.png"
            }
        })
        const avancarBtn = document.getElementById("btn-avancar")
        if (avancarBtn) {
            avancarBtn.style.opacity = "1"
            avancarBtn.style.pointerEvents = "auto"
        }
    }

    window.confirmarResposta = function () {
        if (!selecaoAtual) return
        respostasUsuario[indicePergunta] = selecaoAtual
        selecaoAtual.pontua.forEach((area) => score[area]++)
        indicePergunta++
        if (indicePergunta < perguntas.length) {
            mostrarPergunta()
        } else {
            mostrarResultado()
        }
    }

    window.voltarPergunta = function () {
        if (indicePergunta > 0) {
            const respostaAnterior = respostasUsuario[indicePergunta - 1]
            if (respostaAnterior) {
                respostaAnterior.pontua.forEach((area) => score[area]--)
            }
            indicePergunta--
            mostrarPergunta()
        }
    }

    function salvarResultadoLocalStorage(resultado, areaNome) {
        const dados = {
            resultado,
            areaNome,
            timestamp: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados))
    }

    function mostrarResultado(resultadoExistente = null) {
        const container = document.querySelector("#quiz-container")

        const molduraIntro = document.querySelector(".intro-moldura")
        if (molduraIntro) {
            molduraIntro.style.display = "none"
        }

        let resultado
        let areaNome

        if (resultadoExistente) {
            resultado = resultadoExistente.resultado
            areaNome = resultadoExistente.areaNome
        } else {
            resultado = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0]

            const mapaArea = {
                frontend: "Desenvolvedor(a) Front-end",
                backend: "Desenvolvedor(a) Back-end",
                mobile: "Desenvolvedor(a) Mobile",
                uxui: "Designer UX/UI",
                dados: "Cientista de Dados",
                seguranca: "Analista de Segurança da Informação",
                gestao: "Gestor(a) de Projetos",
                infra: "Especialista em Infraestrutura / DevOps"
            }

            areaNome = mapaArea[resultado]
            salvarResultadoLocalStorage(resultado, areaNome)
        }

        container.innerHTML = `
      <div class="d-flex justify-content-center row mb-4">
        <div class="cta-moldura d-flex align-items-center justify-content-center gap-3">
          <div class="honey-bubble">
            <p class="mb-0">
              Sua vocação é:<br>
              <strong>${areaNome}</strong>
            </p>
          </div>
          <img src="/img/abelha-idoso.webp" class="abelha-bubble" width="150">
        </div>
      </div>

      <div class="quiz-card text-white text-center">
        <p class="">
          Você possui características que se alinham com esta carreira na tecnologia.<br>
          Explore mais sobre ela e comece sua jornada!
        </p>
       <button class="btn btn-warning mt-3 quiz-btn" onclick="iniciarJornada()">INICIAR MINHA JORNADA</button>
<button class="btn btn-outline-warning mt-3 ms-2 quiz-btn" onclick="refazerQuiz()">REFAZER QUIZ</button>
      </div>
    `
    }

    window.refazerQuiz = function () {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(JORNADA_KEY)
        indicePergunta = 0
        Object.keys(score).forEach((k) => (score[k] = 0))
        respostasUsuario.length = 0

        const secao = document.getElementById("jornada-talento")
        if (secao) {
            secao.classList.add("d-none")
        }

        const quizSection = document.getElementById("quiz-section")
        if (quizSection) {
            quizSection.style.display = "block"
        }

        const molduraIntro = document.querySelector(".intro-moldura")
        if (molduraIntro) {
            molduraIntro.style.display = ""
        }

        mostrarPergunta()
    }

    function mostrarJornadaTalento() {
        const secao = document.getElementById("jornada-talento")
        if (!secao) return
        secao.classList.remove("d-none")
        secao.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    window.iniciarJornada = function () {
        const quizSection = document.getElementById("quiz-section")
        if (quizSection) {
            quizSection.style.display = "none"
        }

        localStorage.setItem(JORNADA_KEY, "true")
        mostrarJornadaTalento()

        const finalProject = document.getElementById("final-project")
        if (finalProject) {
            finalProject.style.display = "block"
        }

        const etapa2 = document.getElementById("etapa2")
        if (etapa2) {
            etapa2.style.display = "block"
        }
    }

    const salvo = localStorage.getItem(STORAGE_KEY)
    const jornadaIniciada = localStorage.getItem(JORNADA_KEY) === "true"

    document.getElementById("final-project").style.display = "none"
    document.getElementById("etapa2").style.display = "none"

    if (jornadaIniciada) {
        const quizSection = document.getElementById("quiz-section")
        if (quizSection) {
            quizSection.style.display = "none"
        }

        mostrarJornadaTalento()

        const finalProject = document.getElementById("final-project")
        if (finalProject) {
            finalProject.style.display = "block"
        }

        const etapa2 = document.getElementById("etapa2")
        if (etapa2) {
            etapa2.style.display = "block"
        }

    } else if (salvo) {
        const dadosSalvos = JSON.parse(salvo)
        mostrarResultado(dadosSalvos)

    } else {
        mostrarPergunta()
    }
})

