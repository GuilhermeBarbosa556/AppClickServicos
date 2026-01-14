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
        
        // Configurar segurança básica para avaliações
        console.log("✅ Firestore configurado para avaliações");
        
        // Criar índice para consultas de avaliações se necessário
        setupFirestoreIndexes();
            
        firebaseInitialized = true;
        console.log('✅ Firebase Auth e Firestore inicializados');
        
        // Atualizar variáveis globais
        updateGlobalVariables();
        
        // Disparar evento customizado quando Firebase estiver pronto
        if (typeof window !== 'undefined') {
            window.firebaseReady = true;
            const event = new CustomEvent('firebaseReady');
            window.dispatchEvent(event);
        }
        
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

// Configurar índices do Firestore
function setupFirestoreIndexes() {
    console.log('📊 Configurando índices do Firestore...');
    
    // Índices sugeridos para melhor performance
    const indexes = [
        { collection: 'avaliacoes', fields: ['prestadorId', 'timestamp'], order: 'desc' },
        { collection: 'prestadores', fields: ['ativo', 'avaliacaoMedia'], order: 'desc' },
        { collection: 'prestadores', fields: ['categoria', 'ativo'], order: 'asc' }
    ];
    
    console.log('ℹ️ Índices recomendados:', indexes);
    console.log('💡 Acesse o console do Firebase para criar os índices manualmente se necessário');
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
            
            // Disparar evento
            if (typeof window !== 'undefined') {
                window.firebaseReady = true;
                const event = new CustomEvent('firebaseReady');
                window.dispatchEvent(event);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Firebase sync:', error);
            return false;
        }
    }
    return firebaseInitialized;
}

// Função para obter o Firestore
function getFirestore() {
    if (!isFirebaseAvailable()) {
        console.warn('⚠️ Firebase não disponível, tentando inicializar...');
        tryInitializeFirebaseSync();
    }
    
    if (db === null) {
        console.error('❌ Firestore não disponível');
        throw new Error('Firestore não inicializado');
    }
    
    return db;
}

// Função para obter o Auth
function getAuth() {
    if (!isFirebaseAvailable()) {
        console.warn('⚠️ Firebase não disponível, tentando inicializar...');
        tryInitializeFirebaseSync();
    }
    
    if (auth === null) {
        console.error('❌ Firebase Auth não disponível');
        throw new Error('Firebase Auth não inicializado');
    }
    
    return auth;
}

// Função para adicionar avaliação com retry
async function addRatingWithRetry(ratingData, maxRetries = 3) {
    if (!isFirebaseAvailable()) {
        throw new Error('Firebase não disponível');
    }
    
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await window.firebaseDb.collection('avaliacoes').add(ratingData);
            console.log(`✅ Avaliação salva com sucesso (tentativa ${i + 1})`);
            return result;
        } catch (error) {
            console.error(`❌ Erro ao salvar avaliação (tentativa ${i + 1}):`, error);
            lastError = error;
            
            // Esperar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    throw lastError || new Error('Falha ao salvar avaliação após várias tentativas');
}

// Função para verificar se usuário já avaliou este prestador
async function hasUserRatedProvider(providerId, userId) {
    if (!isFirebaseAvailable()) {
        return false;
    }
    
    try {
        const querySnapshot = await window.firebaseDb.collection('avaliacoes')
            .where('prestadorId', '==', providerId)
            .where('clienteId', '==', userId)
            .limit(1)
            .get();
        
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Erro ao verificar avaliação existente:', error);
        return false;
    }
}

// Função para calcular e atualizar média do prestador
async function updateProviderRating(providerId) {
    if (!isFirebaseAvailable()) {
        throw new Error('Firebase não disponível');
    }
    
    try {
        // Buscar todas as avaliações do prestador
        const querySnapshot = await window.firebaseDb.collection('avaliacoes')
            .where('prestadorId', '==', providerId)
            .get();

        if (querySnapshot.empty) {
            // Se não houver avaliações, definir valores padrão
            await window.firebaseDb.collection('prestadores')
                .doc(providerId)
                .update({
                    avaliacaoMedia: 0,
                    totalAvaliacoes: 0,
                    ultimaAtualizacao: new Date().toISOString()
                });
            return { average: 0, count: 0 };
        }

        let totalRating = 0;
        let count = 0;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            totalRating += data.rating;
            count++;
        });

        const media = totalRating / count;

        // Atualizar prestador com nova média
        await window.firebaseDb.collection('prestadores')
            .doc(providerId)
            .update({
                avaliacaoMedia: parseFloat(media.toFixed(1)),
                totalAvaliacoes: count,
                ultimaAtualizacao: new Date().toISOString()
            });

        console.log(`✅ Média atualizada para ${media.toFixed(2)} (${count} avaliações)`);
        return { average: media, count };

    } catch (error) {
        console.error('❌ Erro ao atualizar avaliação do prestador:', error);
        throw error;
    }
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
    window.getFirestore = getFirestore;
    window.getAuth = getAuth;
    window.addRatingWithRetry = addRatingWithRetry;
    window.hasUserRatedProvider = hasUserRatedProvider;
    window.updateProviderRating = updateProviderRating;
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
    
    if (db) {
        console.log("Firestore pronto para avaliações:", "✅");
    }
    
    console.groupEnd();
    
    // Retornar status para uso em outras funções
    return {
        sdkLoaded: typeof firebase !== 'undefined',
        authAvailable: auth !== null,
        firestoreAvailable: db !== null,
        appAvailable: firebaseApp !== null,
        initialized: firebaseInitialized
    };
}

// Função para testar conexão com Firestore
async function testFirestoreConnection() {
    if (!isFirebaseAvailable()) {
        console.warn('⚠️ Firebase não disponível para teste de conexão');
        return false;
    }
    
    try {
        // Testar conexão com uma consulta simples
        const testQuery = await window.firebaseDb.collection('avaliacoes').limit(1).get();
        console.log('✅ Conexão com Firestore testada com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão com Firestore:', error);
        return false;
    }
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado, iniciando Firebase...');
    
    // Aguardar um pouco para garantir que o SDK do Firebase foi carregado
    setTimeout(() => {
        waitForFirebase();
        
        // Verificar status após 2 segundos
        setTimeout(() => {
            checkFirebaseStatus();
            
            // Testar conexão após inicialização
            setTimeout(async () => {
                if (isFirebaseAvailable()) {
                    await testFirestoreConnection();
                }
            }, 3000);
        }, 2000);
    }, 100);
});

// Tentar inicializar imediatamente se possível
if (typeof firebase !== 'undefined') {
    setTimeout(() => {
        tryInitializeFirebaseSync();
    }, 100);
}

// Adicionar listener para o evento firebaseReady
if (typeof window !== 'undefined') {
    window.addEventListener('firebaseReady', function() {
        console.log('🎉 Firebase pronto para uso!');
        
        // Configurar listener para mudanças de autenticação
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('👤 Usuário autenticado:', user.email);
                } else {
                    console.log('👤 Usuário não autenticado');
                }
            });
        }
    });
}

// Log inicial
console.log('📁 Firebase Config carregado');
console.log('📋 Projeto:', firebaseConfig.projectId);
console.log('🎯 Sistema de avaliações configurado');

// Função auxiliar para formatação de dados
function formatRating(rating) {
    if (!rating || isNaN(rating)) return '0.0';
    return parseFloat(rating).toFixed(1);
}

// Exportar para uso global
window.formatRating = formatRating;