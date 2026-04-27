const firebaseConfig = {
  apiKey: "AIzaSyCknLb_dbbZ7K8-Sm7Lai-xvtskx9PptM4",
  authDomain: "gincana-sustentaveloec.firebaseapp.com",
  projectId: "gincana-sustentaveloec",
  storageBucket: "gincana-sustentaveloec.firebasestorage.app",
  messagingSenderId: "732021087135",
  appId: "1:732021087135:web:43058304d2b371732ebbaa"
};
// Inicializa o Firebase Clássico
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Elementos da Tela
const form = document.getElementById('action-form');
const submitBtn = document.getElementById('submit-btn');
const successMessage = document.getElementById('success-message');
const feedContainer = document.getElementById('feed-container');
const destaqueContainer = document.getElementById('destaque-container');

// Envio do Formulário (Com Exibição Imediata)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
    submitBtn.disabled = true;

    const nome = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();

    try {
        // Salva no banco (O Firebase vai disparar a atualização na tela na mesma hora localmente)
        await db.collection("acoes").add({
            autor: `${nome} ${sobrenome}`,
            descricao: descricao,
            curtidas: 0,
            data: new Date() // Usando o relógio local para aparecer INSTANTANEAMENTE
        });

        // Feedback visual
        form.reset();
        form.classList.add('hidden');
        successMessage.classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('mural').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                form.classList.remove('hidden');
                successMessage.classList.add('hidden');
            }, 3000);
        }, 500);

    } catch (error) {
        console.error("Erro ao salvar: ", error);
        alert("Erro ao enviar. Verifique o console ou as chaves do Firebase.");
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

// Formatação de Data
function formatarData(dataReal) {
    if(!dataReal) return 'Agora mesmo';
    // Se vier do Firebase como Timestamp, converte. Se já for Date local, usa direto.
    const data = dataReal.toDate ? dataReal.toDate() : new Date(dataReal);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Gerador de HTML dos Cards (Agora com botão de Excluir)
function criarHTMLDoCard(acao, id, isDestaque = false) {
    const destaqueLabel = isDestaque ? `<div class="destaque-label"><i class="fas fa-trophy"></i> Destaque da Semana</div>` : '';
    const cardClass = isDestaque ? 'feed-card card-destaque' : 'feed-card';
    
    return `
        <div class="${cardClass}">
            ${destaqueLabel}
            <div class="card-header">
                <span class="card-author"><i class="fas fa-user-circle"></i> ${acao.autor}</span>
                <span class="card-date">${formatarData(acao.data)}</span>
            </div>
            <p style="font-size: 1.05rem; margin-bottom: 15px;">"${acao.descricao}"</p>
            <div class="card-actions">
                <button class="like-btn" onclick="curtirAcao('${id}')">
                    <i class="far fa-thumbs-up"></i> <span id="count-${id}">${acao.curtidas || 0}</span> Curtidas
                </button>
                <button class="delete-btn" onclick="excluirAcao('${id}')" title="Excluir este relato">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </div>
        </div>
    `;
}

// Carrega o Feed e o Destaque
function carregarFeed() {
    db.collection("acoes").orderBy("data", "desc").onSnapshot((snapshot) => {
        feedContainer.innerHTML = ''; 
        destaqueContainer.innerHTML = '';
        destaqueContainer.classList.add('hidden');
        
        if(snapshot.empty) {
            feedContainer.innerHTML = '<p style="text-align:center; color:#666;">Nenhum relato registrado ainda. Seja o primeiro a inspirar a equipe! 🌱</p>';
            return;
        }

        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 7);

        let relatoDestaque = null;
        let idDestaque = null;
        let maiorNumCurtidas = 0;
        const todosRelatos = [];

        snapshot.forEach((docSnap) => {
            const acao = docSnap.data();
            const id = docSnap.id;
            todosRelatos.push({ id, acao });

            if (acao.data) {
                const dataAcao = acao.data.toDate ? acao.data.toDate() : new Date(acao.data);
                if (dataAcao >= dataLimite && acao.curtidas > maiorNumCurtidas) {
                    maiorNumCurtidas = acao.curtidas;
                    relatoDestaque = acao;
                    idDestaque = id;
                }
            }
        });

        if (relatoDestaque) {
            destaqueContainer.innerHTML = criarHTMLDoCard(relatoDestaque, idDestaque, true);
            destaqueContainer.classList.remove('hidden');
        }

        todosRelatos.forEach(({ id, acao }) => {
            if (id !== idDestaque) {
                feedContainer.innerHTML += criarHTMLDoCard(acao, id, false);
            }
        });
    }, (error) => {
        console.error("Erro no feed: ", error);
        feedContainer.innerHTML = '<p style="text-align:center; color:red;">Falha ao carregar. Configure o firebaseConfig e verifique as regras do Firestore.</p>';
    });
}

// Sistema de Curtidas Global
window.curtirAcao = async (id) => {
    try {
        await db.collection("acoes").doc(id).update({
            curtidas: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error("Erro ao curtir:", error);
    }
};

// Sistema de Exclusão Global
window.excluirAcao = async (id) => {
    if(confirm("Tem certeza que deseja excluir este relato?")) {
        try {
            await db.collection("acoes").doc(id).delete();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir. Verifique sua conexão e permissões.");
        }
    }
};

// Inicializa
carregarFeed();
