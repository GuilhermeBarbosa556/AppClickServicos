// config.js - Configurações globais do aplicativo
const CONFIG = {
    APP_NAME: 'Click Serviços',
    API_BASE_URL: '', // Removido localhost para GitHub Pages
    DEFAULT_LOCATION: 'São Paulo, SP',
    SUPPORT_EMAIL: 'suporte@clickservicos.com',
    SUPPORT_PHONE: '+5511999999999',
    
    // Categorias de serviços
    CATEGORIES: [
        'Elétrica',
        'Limpeza',
        'Encanamento',
        'Construção',
        'Aulas',
        'Reformas',
        'Pintura',
        'Jardim',
        'Móveis',
        'Tecnologia'
    ],
    
    // Configurações Firebase
    USE_FIREBASE: true,
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyDnFkFgDhAhC9iftYNFhXdzuKB3UBE_BSw",
        authDomain: "clickservicos-34a9d.firebaseapp.com",
        projectId: "clickservicos-34a9d",
        storageBucket: "clickservicos-34a9d.firebasestorage.app",
        messagingSenderId: "104678131910",
        appId: "1:104678131910:web:faa437799bda30a631efc7",
        measurementId: "G-Q3WTZGNQK6"
    },
    
    // Configurações de avaliação
    RATING_SYSTEM: {
        MAX_RATING: 5,
        MIN_RATING: 1,
        REQUIRE_COMMENT: false
    }
};

// Função para salvar preferências do usuário
function saveUserPreferences(prefs) {
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
}

function getUserPreferences() {
    const prefs = localStorage.getItem('userPreferences');
    return prefs ? JSON.parse(prefs) : {};
}

// Função para verificar se Firebase está disponível (compatibilidade)
function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && 
           window.firebaseAuth && 
           window.firebaseDb;
}

// Função para carregar serviços
async function loadServices() {
    if (isFirebaseAvailable()) {
        try {
            const querySnapshot = await window.firebaseDb.collection('prestadores')
                .where('ativo', '==', true)
                .limit(20)
                .get();
            
            const services = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                services.push({
                    id: doc.id,
                    ...data
                });
            });
            return services;
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            return [];
        }
    }
    return []; // Retorna array vazio quando não há serviços
}

// Função para carregar avaliações de um prestador
async function loadProviderRatings(providerId) {
    if (isFirebaseAvailable()) {
        try {
            const querySnapshot = await window.firebaseDb.collection('avaliacoes')
                .where('prestadorId', '==', providerId)
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();
            
            const ratings = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                ratings.push({
                    id: doc.id,
                    ...data
                });
            });
            return ratings;
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            return [];
        }
    }
    return [];
}

// Função para calcular média de avaliações
async function calculateAverageRating(providerId) {
    const ratings = await loadProviderRatings(providerId);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return sum / ratings.length;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.saveUserPreferences = saveUserPreferences;
    window.getUserPreferences = getUserPreferences;
    window.isFirebaseAvailable = isFirebaseAvailable;
    window.loadServices = loadServices;
    window.loadProviderRatings = loadProviderRatings;
    window.calculateAverageRating = calculateAverageRating;
}

// Log inicial
console.log('Configurações carregadas:', CONFIG.APP_NAME);