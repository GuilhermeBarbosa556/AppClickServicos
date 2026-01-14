// firebase-config.js
// Configurações do Firebase para GitHub Pages

const firebaseConfig = {
  apiKey: "AIzaSyDnFkFgDhAhC9iftYNFhXdzuKB3UBE_BSw",
  authDomain: "clickservicos-34a9d.firebaseapp.com",
  projectId: "clickservicos-34a9d",
  storageBucket: "clickservicos-34a9d.firebasestorage.app",
  messagingSenderId: "104678131910",
  appId: "1:104678131910:web:faa437799bda30a631efc7",
  measurementId: "G-Q3WTZGNQK6"
};

// Variáveis globais
let auth = null;
let db = null;
let firebaseApp = null;
let firebaseInitialized = false;

// Inicializar Firebase
function initializeFirebase() {
    try {
        console.log('🔧 Inicializando Firebase...');
        
        // Verificar se o SDK do Firebase está carregado
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK não carregado');
            throw new Error('Firebase SDK não encontrado');
        }
        
        // Verificar se já existe uma instância do Firebase
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log("🔥 Firebase inicializado com sucesso!");
        } else {
            firebaseApp = firebase.app(); // Usar instância existente
            console.log("🔥 Firebase já estava inicializado");
        }
        
        // Inicializar serviços
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar persistence (manter usuário logado)
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log("✅ Persistência de autenticação configurada");
            })
            .catch((error) => {
                console.error("❌ Erro na persistência:", error);
            });
            
        firebaseInitialized = true;
        console.log('✅ Firebase Auth e Firestore inicializados');
        
        // Atualizar variáveis globais
        updateGlobalVariables();
        
    } catch (error) {
        console.error("❌ Erro ao inicializar Firebase:", error);
        // Fallback para sistema local
        auth = null;
        db = null;
        firebaseApp = null;
        firebaseInitialized = false;
        console.log('⚠️ Usando fallback para localStorage');
    }
}

// Atualizar variáveis globais
function updateGlobalVariables() {
    if (typeof window !== 'undefined') {
        window.firebaseAuth = auth;
        window.firebaseDb = db;
        window.firebaseApp = firebaseApp;
        window.firebaseInitialized = firebaseInitialized;
    }
}

// Aguardar o SDK do Firebase ser carregado
function waitForFirebase() {
    if (typeof firebase !== 'undefined') {
        initializeFirebase();
    } else {
        console.log('⏳ Aguardando carregamento do Firebase SDK...');
        setTimeout(waitForFirebase, 100);
    }
}

// Função para verificar se Firebase está disponível
function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && 
           auth !== null && 
           db !== null &&
           firebaseApp !== null &&
           firebaseInitialized;
}

// Tentar inicializar Firebase de forma síncrona
function tryInitializeFirebaseSync() {
    if (typeof firebase !== 'undefined' && !firebaseInitialized) {
        try {
            if (!firebase.apps.length) {
                firebaseApp = firebase.initializeApp(firebaseConfig);
            } else {
                firebaseApp = firebase.app();
            }
            auth = firebase.auth();
            db = firebase.firestore();
            firebaseInitialized = true;
            updateGlobalVariables();
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Firebase sync:', error);
            return false;
        }
    }
    return firebaseInitialized;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    // Inicializar variáveis globais
    updateGlobalVariables();
    
    // Exportar funções
    window.initializeFirebase = initializeFirebase;
    window.isFirebaseAvailable = isFirebaseAvailable;
    window.tryInitializeFirebaseSync = tryInitializeFirebaseSync;
    window.waitForFirebase = waitForFirebase;
}

// Função de debug
function checkFirebaseStatus() {
    console.group("🔥 Status do Firebase");
    console.log("Firebase SDK carregado:", typeof firebase !== 'undefined');
    console.log("Auth disponível:", auth !== null);
    console.log("Firestore disponível:", db !== null);
    console.log("App disponível:", firebaseApp !== null);
    console.log("Firebase inicializado:", firebaseInitialized);
    console.log("Configuração carregada:", firebaseConfig ? "✅" : "❌");
    console.groupEnd();
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado, iniciando Firebase...');
    
    // Aguardar um pouco para garantir que o SDK do Firebase foi carregado
    setTimeout(() => {
        waitForFirebase();
        
        // Verificar status após 2 segundos
        setTimeout(checkFirebaseStatus, 2000);
    }, 100);
});

// Tentar inicializar imediatamente se possível
if (typeof firebase !== 'undefined') {
    setTimeout(() => {
        tryInitializeFirebaseSync();
    }, 100);
}

// Log inicial
console.log('📁 Firebase Config carregado');
console.log('📋 Projeto:', firebaseConfig.projectId);