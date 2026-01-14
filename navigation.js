// navigation.js - Gerenciamento de navegação entre páginas com Firebase
// Compatível com GitHub Pages

// Função para verificar se Firebase está disponível (compatibilidade)
function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && 
           window.firebaseAuth && 
           window.firebaseDb &&
           window.firebaseAuth.currentUser !== undefined;
}

// Verificar status de login
async function isLoggedIn() {
    // Primeiro verificar Firebase se disponível
    if (isFirebaseAvailable()) {
        try {
            // Verificar se há usuário atual no Firebase Auth
            const user = window.firebaseAuth.currentUser;
            if (user) {
                return true;
            }
        } catch (error) {
            console.log('Erro ao verificar Firebase Auth:', error);
        }
    }
    
    // Fallback para localStorage
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Obter dados do usuário
async function getUserData() {
    // Tentar obter do Firebase primeiro
    if (isFirebaseAvailable()) {
        const user = window.firebaseAuth.currentUser;
        if (user) {
            try {
                // Buscar dados do Firestore
                if (window.firebaseDb && window.firebaseDb.collection) {
                    const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const data = userDoc.data();
                        return {
                            nome: data.nome || user.displayName || 'Usuário',
                            email: data.email || user.email || '',
                            telefone: data.telefone || '',
                            localizacao: data.localizacao || (window.CONFIG?.DEFAULT_LOCATION || 'São Paulo, SP'),
                            tipo: data.tipo || 'client',
                            categoria: data.categoria || '',
                            descricao: data.descricao || '',
                            uid: user.uid,
                            fotoUrl: user.photoURL || null,
                            dataCadastro: data.dataCadastro || new Date().toISOString()
                        };
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
                // Continuar com dados básicos do Firebase Auth
                return {
                    nome: user.displayName || 'Usuário',
                    email: user.email || '',
                    uid: user.uid,
                    fotoUrl: user.photoURL || null,
                    tipo: 'client',
                    localizacao: window.CONFIG?.DEFAULT_LOCATION || 'São Paulo, SP'
                };
            }
        }
    }
    
    // Fallback para localStorage
    return {
        nome: localStorage.getItem('userName') || 'Usuário',
        email: localStorage.getItem('userEmail') || 'usuario@email.com',
        telefone: localStorage.getItem('userPhone') || '',
        localizacao: localStorage.getItem('userLocation') || (window.CONFIG?.DEFAULT_LOCATION || 'São Paulo, SP'),
        tipo: localStorage.getItem('userType') || 'client',
        categoria: localStorage.getItem('userCategory') || '',
        descricao: localStorage.getItem('userDescription') || '',
        uid: localStorage.getItem('userUid') || ''
    };
}

// Atualizar dados do usuário
async function updateUserData(userData) {
    console.log('Atualizando dados do usuário:', userData);
    
    // Salvar no localStorage
    if (userData.nome) localStorage.setItem('userName', userData.nome);
    if (userData.email) localStorage.setItem('userEmail', userData.email);
    if (userData.telefone) localStorage.setItem('userPhone', userData.telefone);
    if (userData.localizacao) localStorage.setItem('userLocation', userData.localizacao);
    if (userData.tipo) localStorage.setItem('userType', userData.tipo);
    if (userData.categoria) localStorage.setItem('userCategory', userData.categoria);
    if (userData.descricao) localStorage.setItem('userDescription', userData.descricao);
    if (userData.uid) localStorage.setItem('userUid', userData.uid);
    
    // Salvar no Firestore se disponível
    if (isFirebaseAvailable() && userData.uid && window.firebaseDb && window.firebaseDb.collection) {
        try {
            const userRef = window.firebaseDb.collection('users').doc(userData.uid);
            await userRef.set({
                ...userData,
                dataAtualizacao: new Date().toISOString()
            }, { merge: true });
            
            // Se for prestador, atualizar também na coleção de prestadores
            if (userData.tipo === 'provider') {
                const prestadorRef = window.firebaseDb.collection('prestadores').doc(userData.uid);
                await prestadorRef.set({
                    nome: userData.nome,
                    email: userData.email,
                    telefone: userData.telefone,
                    localizacao: userData.localizacao,
                    categoria: userData.categoria,
                    descricao: userData.descricao,
                    ativo: true,
                    dataAtualizacao: new Date().toISOString()
                }, { merge: true });
            }
            
            console.log('✅ Dados atualizados no Firestore com sucesso!');
            return userData;
        } catch (error) {
            console.error('❌ Erro ao atualizar dados no Firestore:', error);
            // Não lançar erro, apenas continuar com localStorage
            console.log('⚠️ Continuando com dados no localStorage apenas');
        }
    }
    
    return userData;
}

// Logout
async function logout() {
    console.log('🚪 Executando logout...');
    try {
        if (isFirebaseAvailable() && window.firebaseAuth && window.firebaseAuth.signOut) {
            await window.firebaseAuth.signOut();
            console.log('✅ Logout do Firebase realizado');
        }
    } catch (error) {
        console.error('❌ Erro ao fazer logout do Firebase:', error);
        // Continuar mesmo com erro
    }
    
    // Limpar localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userLocation');
    localStorage.removeItem('userType');
    localStorage.removeItem('userCategory');
    localStorage.removeItem('userDescription');
    localStorage.removeItem('userUid');
    
    console.log('✅ Dados locais limpos');
    console.log('🔄 Redirecionando para login...');
    
    // Pequeno delay para visualização
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

// Redirecionar para login se não estiver logado
async function requireLogin() {
    const loggedIn = await isLoggedIn();
    if (!loggedIn && !window.location.href.includes('login.html') && 
        !window.location.href.includes('register.html')) {
        console.log('👤 Usuário não logado, redirecionando para login...');
        window.location.href = 'login.html';
    }
}

// Redirecionar para index se já estiver logado
async function redirectIfLoggedIn() {
    const loggedIn = await isLoggedIn();
    if (loggedIn && (window.location.href.includes('login.html') || 
        window.location.href.includes('register.html'))) {
        console.log('✅ Usuário já logado, redirecionando para index...');
        window.location.href = 'index.html';
    }
}

// Verificar autenticação Firebase em tempo real
function setupAuthListener() {
    if (isFirebaseAvailable() && window.firebaseAuth && window.firebaseAuth.onAuthStateChanged) {
        window.firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                // Usuário logado
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userUid', user.uid);
                
                if (user.email) {
                    localStorage.setItem('userEmail', user.email);
                }
                
                if (user.displayName) {
                    localStorage.setItem('userName', user.displayName);
                }
                
                console.log('✅ Usuário autenticado:', user.email);
                
                // Atualizar dados do usuário
                try {
                    const userData = await getUserData();
                    await updateUserData(userData);
                } catch (error) {
                    console.error('Erro ao atualizar dados do usuário:', error);
                }
            } else {
                // Usuário deslogado
                console.log('👤 Usuário não autenticado');
                
                // Manter redirecionamento apenas se estiver na página principal
                if (window.location.href.includes('index.html')) {
                    const currentPath = window.location.pathname;
                    if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
                        console.log('🔄 Redirecionando para login...');
                        window.location.href = 'login.html';
                    }
                }
            }
        });
    } else {
        console.log('ℹ️ Firebase não disponível para listener de autenticação');
    }
}

// Inicializar navegação
async function initNavigation() {
    console.log('🚀 Inicializando navegação...');
    
    // Configurar listener de autenticação
    setupAuthListener();
    
    // Verificar redirecionamentos
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;
    
    // Verificar se estamos na página inicial (index.html ou raiz)
    const isIndexPage = currentUrl.includes('index.html') || 
                       currentPath.endsWith('/') || 
                       currentPath.endsWith('index.html');
    
    if (isIndexPage) {
        await requireLogin();
    } else if (currentUrl.includes('login.html') || currentUrl.includes('register.html')) {
        await redirectIfLoggedIn();
    }
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
    window.navigation = {
        isLoggedIn,
        getUserData,
        updateUserData,
        logout,
        requireLogin,
        redirectIfLoggedIn,
        initNavigation,
        isFirebaseAvailable
    };
}

// Executar inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Navegação: DOM carregado');
    
    // Pequeno delay para garantir que o Firebase tenha tempo de carregar
    setTimeout(() => {
        initNavigation().catch(error => {
            console.error('❌ Erro na inicialização da navegação:', error);
        });
    }, 300);
});

// Log de inicialização
console.log('🔄 Navegação.js carregado');