const firebaseConfig = {
  apiKey: "AIzaSyCknLb_dbbZ7K8-Sm7Lai-xvtskx9PptM4",
  authDomain: "gincana-sustentaveloec.firebaseapp.com",
  projectId: "gincana-sustentaveloec",
  storageBucket: "gincana-sustentaveloec.firebasestorage.app",
  messagingSenderId: "732021087135",
  appId: "1:732021087135:web:43058304d2b371732ebbaa"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('action-form');
const submitBtn = document.getElementById('submit-btn');
const successMessage = document.getElementById('success-message');
const feedContainer = document.getElementById('feed-container');
const destaqueContainer = document.getElementById('destaque-container');

// Envio do Formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
    submitBtn.disabled = true;

    const nome = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();

    try {
        await addDoc(collection(db, "acoes"), {
            autor: `${nome} ${sobrenome}`,
            descricao: descricao,
            curtidas: 0,
            data: serverTimestamp()
        });

        form.reset();
        form.classList.add('hidden');
        successMessage.classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('mural').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                form.classList.remove('hidden');
                successMessage.classList.add('hidden');
            }, 4000);
        }, 1000);

    } catch (error) {
        console.error("Erro ao salvar: ", error);
        alert("Ocorreu um erro ao enviar seu relato. Tente novamente.");
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

function formatarData(timestamp) {
    if(!timestamp) return 'Agora mesmo';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Gera o HTML do Card (usado para o feed normal e para o destaque)
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
            </div>
        </div>
    `;
}

// Carrega o Feed e define o Destaque
function carregarFeed() {
    const q = query(collection(db, "acoes"), orderBy("data", "desc"));
    
    onSnapshot(q, (snapshot) => {
        feedContainer.innerHTML = ''; 
        destaqueContainer.innerHTML = '';
        destaqueContainer.classList.add('hidden');
        
        if(snapshot.empty) {
            feedContainer.innerHTML = '<p style="text-align:center; color:#666;">Nenhum relato registrado ainda. Seja o primeiro a inspirar a equipe! 🌱</p>';
            return;
        }

        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 7); // Últimos 7 dias

        let relatoDestaque = null;
        let idDestaque = null;
        let maiorNumCurtidas = 0;
        const todosRelatos = [];

        // Primeira passada: encontrar o destaque e salvar os dados
        snapshot.forEach((docSnap) => {
            const acao = docSnap.data();
            const id = docSnap.id;
            todosRelatos.push({ id, acao });

            if (acao.data) {
                const dataAcao = acao.data.toDate();
                // Verifica se é dos últimos 7 dias e tem o maior número de curtidas (mínimo 1)
                if (dataAcao >= dataLimite && acao.curtidas > maiorNumCurtidas) {
                    maiorNumCurtidas = acao.curtidas;
                    relatoDestaque = acao;
                    idDestaque = id;
                }
            }
        });

        // Renderiza o Destaque, se houver
        if (relatoDestaque) {
            destaqueContainer.innerHTML = criarHTMLDoCard(relatoDestaque, idDestaque, true);
            destaqueContainer.classList.remove('hidden');
        }

        // Renderiza o resto do feed
        todosRelatos.forEach(({ id, acao }) => {
            // Evita duplicar o destaque no feed geral
            if (id !== idDestaque) {
                feedContainer.innerHTML += criarHTMLDoCard(acao, id, false);
            }
        });
    });
}

// Sistema de Curtidas
window.curtirAcao = async (id) => {
    try {
        const docRef = doc(db, "acoes", id);
        await updateDoc(docRef, { curtidas: increment(1) });
    } catch (error) {
        console.error("Erro ao curtir:", error);
    }
};

carregarFeed();
