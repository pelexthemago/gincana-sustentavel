const firebaseConfig = {
  apiKey: "AIzaSyCknLb_dbbZ7K8-Sm7Lai-xvtskx9PptM4",
  authDomain: "gincana-sustentaveloec.firebaseapp.com",
  projectId: "gincana-sustentaveloec",
  storageBucket: "gincana-sustentaveloec.firebasestorage.app",
  messagingSenderId: "732021087135",
  appId: "1:732021087135:web:43058304d2b371732ebbaa"
};
// 2. Inicializa o Firebase Clássico
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Elementos da Tela
const form = document.getElementById('action-form');
const submitBtn = document.getElementById('submit-btn');
const successMessage = document.getElementById('success-message');
const feedContainer = document.getElementById('feed-container');
const destaqueContainer = document.getElementById('destaque-container');

// 4. Envio do Formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Agora este comando vai funcionar perfeitamente
    
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
    submitBtn.disabled = true;

    const nome = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();

    try {
        await db.collection("acoes").add({
            autor: `${nome} ${sobrenome}`,
            descricao: descricao,
            curtidas: 0,
            data: firebase.firestore.FieldValue.serverTimestamp()
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
        alert("Erro ao enviar. Verifique se configurou as chaves do Firebase e se o Firestore foi criado.");
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

// 5. Formatação de Data
function formatarData(timestamp) {
    if(!timestamp) return 'Agora mesmo';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// 6. Gerador de HTML dos Cards
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

// 7. Carrega o Feed e o Destaque
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
                const dataAcao = acao.data.toDate();
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

// 8. Sistema de Curtidas Global
window.curtirAcao = async (id) => {
    try {
        await db.collection("acoes").doc(id).update({
            curtidas: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error("Erro ao curtir:", error);
    }
};

// 9. Inicializa
carregarFeed();
