const firebaseConfig = {
  apiKey: "AIzaSyCknLb_dbbZ7K8-Sm7Lai-xvtskx9PptM4",
  authDomain: "gincana-sustentaveloec.firebaseapp.com",
  projectId: "gincana-sustentaveloec",
  storageBucket: "gincana-sustentaveloec.firebasestorage.app",
  messagingSenderId: "732021087135",
  appId: "1:732021087135:web:43058304d2b371732ebbaa"
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.enviar = async function () {

  const nome = document.getElementById("nome").value;
  const sobrenome = document.getElementById("sobrenome").value;
  const descricao = document.getElementById("descricao").value;

  await addDoc(collection(db, "acoes"), {
    nome,
    sobrenome,
    descricao,
    curtidas: 0,
    data: new Date()
  });

  document.getElementById("mensagem").innerText =
    "Obrigado! Veja abaixo 👇";

  carregar();
};

async function carregar() {
  const mural = document.getElementById("mural");
  mural.innerHTML = "";

  const dados = await getDocs(collection(db, "acoes"));

  dados.forEach(docItem => {
    const d = docItem.data();

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <b>${d.nome} ${d.sobrenome}</b>
      <p>${d.descricao}</p>
      <small>${new Date(d.data.seconds * 1000).toLocaleDateString()}</small>
      <br>
      👍 ${d.curtidas}
    `;

    mural.appendChild(div);
  });
}

carregar();