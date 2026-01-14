// script.js - Lógica principal da aplicação com Firebase
// Compatível com GitHub Pages

// Função para verificar se Firebase está disponível
function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && 
           window.firebaseAuth && 
           window.firebaseDb &&
           window.firebaseAuth.currentUser !== undefined;
}

// Dados dos serviços (vazio para ser preenchido do Firestore)
const servicos = [];

// Estado da aplicação
let servicosFiltrados = [...servicos];
let termoBusca = '';
let ordenacaoAtual = '';
let prestadorAtual = null;
let carregandoServicos = false;

// Função para inicializar elementos DOM
function initDOMElements() {
    console.log('🔧 Inicializando elementos DOM...');
    
    const elements = {
        mainScreen: document.getElementById('main-screen'),
        providerProfileScreen: document.getElementById('provider-profile-screen'),
        userProfileScreen: document.getElementById('user-profile-screen'),
        servicesList: document.getElementById('services-list'),
        searchInput: document.getElementById('search-input'),
        sortButton: document.getElementById('sort-button'),
        filterButton: document.getElementById('filter-button')
    };
    
    // Log de quais elementos foram encontrados
    Object.keys(elements).forEach(key => {
        console.log(`${key}:`, elements[key] ? '✅ Encontrado' : '❌ Não encontrado');
    });
    
    return elements;
}

// Funções de contato
function fazerLigacao(telefone) {
    const numeroLimpo = telefone.replace(/[^\d+]/g, '');
    
    if (confirm(`Deseja ligar para ${numeroLimpo}?`)) {
        window.location.href = `tel:${numeroLimpo}`;
    }
}

function abrirWhatsApp(telefone, mensagem = 'Olá, gostaria de solicitar seu serviço!') {
    const numeroLimpo = telefone.replace(/[^\d+]/g, '');
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    window.open(`https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`, '_blank');
}

function enviarEmail(email, assunto = 'Solicitação de Serviço', corpo = 'Olá, gostaria de solicitar seu serviço!') {
    const assuntoCodificado = encodeURIComponent(assunto);
    const corpoCodificado = encodeURIComponent(corpo);
    
    window.location.href = `mailto:${email}?subject=${assuntoCodificado}&body=${corpoCodificado}`;
}

// Função para mostrar toast
function showToast(message, type = 'info') {
    // Remover toasts antigos
    document.querySelectorAll('.toast').forEach(toast => {
        if (toast.parentNode) {
            toast.remove();
        }
    });
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        ${message}
        <button class="toast-close">
            <span class="material-icons">close</span>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remover toast após 5 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 5000);
    
    // Fechar ao clicar no botão
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    });
}

// Carregar serviços do Firestore
async function carregarServicosFirestore() {
    // Verificar disponibilidade do Firebase
    if (!isFirebaseAvailable()) {
        console.log('ℹ️ Firebase não disponível');
        
        // Tentar inicializar Firebase
        if (typeof initializeFirebase === 'function') {
            console.log('🔄 Tentando inicializar Firebase...');
            initializeFirebase();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!isFirebaseAvailable()) {
            console.log('⚠️ Firebase não inicializado, exibindo estado vazio');
            mostrarEstadoVazio();
            return false;
        }
    }
    
    if (carregandoServicos) return false;
    
    carregandoServicos = true;
    
    try {
        console.log('📡 Buscando serviços do Firestore...');
        
        // Verificar se firebaseDb está disponível
        if (!window.firebaseDb || !window.firebaseDb.collection) {
            throw new Error('Firestore não disponível');
        }
        
        const querySnapshot = await window.firebaseDb.collection('prestadores')
            .where('ativo', '==', true)
            .limit(20)
            .get();
        
        if (!querySnapshot.empty) {
            // Limpar array existente
            servicos.length = 0;
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                servicos.push({
                    id: doc.id,
                    nome: data.nome || 'Prestador',
                    categoria: data.categoria || 'Serviço',
                    descricao: data.descricao || 'Serviço profissional de qualidade',
                    avaliacao: data.avaliacaoMedia || (3.5 + Math.random() * 1.5), // 3.5 a 5.0
                    distancia: data.distancia || (Math.random() * 5 + 0.5), // 0.5 a 5.5 km
                    preco: data.precoMedio || (50 + Math.random() * 100), // R$50 a R$150
                    telefone: data.telefone || '+5511999999999',
                    whatsapp: data.whatsapp || data.telefone || '+5511999999999',
                    email: data.email || 'contato@servico.com',
                    uid: doc.id
                });
            });
            
            servicosFiltrados = [...servicos];
            console.log(`✅ ${servicos.length} serviços carregados do Firestore`);
            showToast(`${servicos.length} serviços encontrados!`, 'success');
            return true;
        } else {
            console.log('ℹ️ Nenhum prestador encontrado no Firestore');
            mostrarEstadoVazio();
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar serviços do Firestore:', error);
        mostrarEstadoVazio();
        return false;
    } finally {
        carregandoServicos = false;
    }
}

// Mostrar estado vazio (sem serviços)
function mostrarEstadoVazio() {
    console.log('📭 Nenhum serviço disponível');
    
    // Limpar array existente
    servicos.length = 0;
    servicosFiltrados = [...servicos];
    
    const servicesList = document.getElementById('services-list');
    if (servicesList) {
        servicesList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons empty-state-icon">business_center</span>
                <p class="empty-state-text">Nenhum serviço disponível</p>
                <p style="color: var(--text-light); font-size: 14px; margin-top: 8px;">
                    Cadastre-se como prestador para oferecer serviços
                </p>
                <button class="nav-button" style="margin-top: 16px;" onclick="window.location.href='register.html'">
                    <span class="material-icons">person_add</span>
                    Cadastrar-se como Prestador
                </button>
            </div>
        `;
    }
}

// Inicialização
async function init() {
    console.log('🚀 Inicializando aplicação...');
    
    // Inicializar elementos DOM
    const elements = initDOMElements();
    
    // Verificar se servicesList existe
    if (!elements.servicesList) {
        console.error('❌ Elemento services-list não encontrado no DOM');
        showToast('Erro ao carregar a aplicação. Elemento não encontrado.', 'error');
        return;
    }
    
    // Verificar se o usuário está logado
    if (typeof navigation !== 'undefined') {
        const loggedIn = await navigation.isLoggedIn();
        if (!loggedIn) {
            console.log('👤 Usuário não logado, redirecionando para login...');
            showToast('Por favor, faça login para continuar', 'info');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }
    } else if (!localStorage.getItem('isLoggedIn')) {
        console.log('👤 Usuário não logado (localStorage), redirecionando...');
        showToast('Por favor, faça login para continuar', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    console.log('✅ Usuário logado, carregando dados...');
    
    // Carregar dados do usuário
    await carregarDadosUsuario();
    
    // Verificar se Firebase está disponível
    console.log('🔍 Verificando Firebase...');
    console.log('Firebase disponível:', isFirebaseAvailable());
    
    // Carregar serviços
    console.log('📥 Tentando carregar serviços...');
    const servicosCarregados = await carregarServicosFirestore();
    
    // Renderizar serviços (só se houver serviços)
    if (servicosCarregados && servicosFiltrados.length > 0) {
        renderServicos(elements.servicesList);
    }
    
    // Configurar event listeners
    setupEventListeners(elements);
    
    console.log('✅ Aplicação inicializada com sucesso!');
}

// Carregar dados do usuário
async function carregarDadosUsuario() {
    if (typeof navigation !== 'undefined') {
        const userData = await navigation.getUserData();
        
        console.log('👤 Dados do usuário carregados:', userData);
        
        // Atualizar perfil do usuário se necessário
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        
        if (userNameElement && userData.nome) {
            userNameElement.textContent = userData.nome;
        }
        
        if (userEmailElement && userData.email) {
            userEmailElement.textContent = userData.email;
        }
        
        // Verificar se é prestador e carregar seus serviços
        if (userData.tipo === 'provider' && isFirebaseAvailable()) {
            await carregarMeusServicos(userData.uid);
        }
    }
}

// Carregar serviços do prestador atual
async function carregarMeusServicos(prestadorId) {
    if (!isFirebaseAvailable()) return;
    
    try {
        const prestadorDoc = await window.firebaseDb.collection('prestadores').doc(prestadorId).get();
        if (prestadorDoc.exists) {
            console.log('📋 Dados do prestador carregados:', prestadorDoc.data());
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados do prestador:', error);
    }
}

// Renderizar serviços
function renderServicos(servicesListElement) {
    console.log('🎨 Renderizando serviços...', servicosFiltrados.length);
    
    // Verificar se servicesList existe
    if (!servicesListElement) {
        console.error('❌ Elemento services-list não encontrado ao renderizar');
        return;
    }
    
    servicesListElement.innerHTML = '';
    
    if (servicosFiltrados.length === 0) {
        mostrarEstadoVazio();
        return;
    }
    
    servicosFiltrados.forEach(servico => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="service-card-content">
                <div class="service-avatar">
                    <span class="material-icons">person</span>
                </div>
                <div class="service-info">
                    <h3 class="service-name">${servico.nome}</h3>
                    <p class="service-description">${servico.descricao}</p>
                    <div class="service-details">
                        <div class="service-detail rating">
                            <span class="material-icons">star</span>
                            <span>${servico.avaliacao.toFixed(1)}</span>
                        </div>
                        <div class="service-detail distance">
                            <span class="material-icons">location_on</span>
                            <span>${servico.distancia.toFixed(1)} km</span>
                        </div>
                        <div class="service-detail price">
                            <span class="material-icons">attach_money</span>
                            <span>R$${servico.preco.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <span class="material-icons" style="color: #ddd; align-self: center;">arrow_forward_ios</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            abrirPerfilPrestador(servico);
        });
        
        servicesListElement.appendChild(card);
    });
}

// Filtrar serviços
function filtrarServicos(servicesListElement, sortBy = '') {
    const busca = termoBusca.trim().toLowerCase();
    
    if (!busca) {
        servicosFiltrados = [...servicos];
    } else {
        servicosFiltrados = servicos.filter(servico => {
            return servico.nome.toLowerCase().includes(busca) ||
                   servico.descricao.toLowerCase().includes(busca) ||
                   servico.categoria.toLowerCase().includes(busca);
        });
    }
    
    // Aplicar ordenação se especificada
    if (sortBy) {
        ordenacaoAtual = sortBy;
    }
    
    aplicarOrdenacao();
    renderServicos(servicesListElement);
    
    // Mostrar feedback
    if (sortBy) {
        let sortText = '';
        switch (sortBy) {
            case 'rating': sortText = 'Melhor Avaliação'; break;
            case 'distance': sortText = 'Mais Próximo'; break;
            case 'price': sortText = 'Menor Preço'; break;
        }
        showToast(`Ordenado por: ${sortText}`, 'info');
    }
}

// Aplicar ordenação
function aplicarOrdenacao() {
    if (ordenacaoAtual === 'rating') {
        servicosFiltrados.sort((a, b) => b.avaliacao - a.avaliacao);
    } else if (ordenacaoAtual === 'distance') {
        servicosFiltrados.sort((a, b) => a.distancia - b.distancia);
    } else if (ordenacaoAtual === 'price') {
        servicosFiltrados.sort((a, b) => a.preco - b.preco);
    }
}

// Abrir perfil do prestador
function abrirPerfilPrestador(servico) {
    const mainScreen = document.getElementById('main-screen');
    const providerProfileScreen = document.getElementById('provider-profile-screen');
    
    if (!mainScreen || !providerProfileScreen) {
        console.error('❌ Elementos de tela não encontrados');
        return;
    }
    
    prestadorAtual = servico;
    
    // Atualizar elementos do perfil
    const providerName = document.getElementById('provider-name');
    const providerCategory = document.getElementById('provider-category');
    const providerRating = document.getElementById('provider-rating');
    const providerDistance = document.getElementById('provider-distance');
    const providerDescription = document.getElementById('provider-description');
    const providerPrice = document.getElementById('provider-price');
    
    if (providerName) providerName.textContent = servico.nome;
    if (providerCategory) providerCategory.textContent = servico.categoria;
    if (providerRating) providerRating.textContent = servico.avaliacao.toFixed(1);
    if (providerDistance) providerDistance.textContent = `${servico.distancia.toFixed(1)} km`;
    if (providerDescription) providerDescription.textContent = servico.descricao;
    if (providerPrice) providerPrice.textContent = `R$${servico.preco.toFixed(2)}`;
    
    mainScreen.classList.add('hidden');
    providerProfileScreen.classList.remove('hidden');
}

// Configurar event listeners
function setupEventListeners(elements) {
    console.log('🔗 Configurando event listeners...');
    
    // Busca
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            termoBusca = e.target.value;
            filtrarServicos(elements.servicesList);
        });
    }
    
    // Botões de contato
    const phoneButton = document.getElementById('phone-button');
    if (phoneButton) {
        phoneButton.addEventListener('click', () => {
            if (prestadorAtual && prestadorAtual.telefone) {
                fazerLigacao(prestadorAtual.telefone);
            } else {
                showToast('Número de telefone não disponível', 'error');
            }
        });
    }
    
    const whatsappButton = document.getElementById('whatsapp-button');
    if (whatsappButton) {
        whatsappButton.addEventListener('click', () => {
            if (prestadorAtual && prestadorAtual.whatsapp) {
                const mensagem = `Olá ${prestadorAtual.nome.split(' - ')[0]}, gostaria de solicitar seu serviço de ${prestadorAtual.categoria}!`;
                abrirWhatsApp(prestadorAtual.whatsapp, mensagem);
            } else {
                showToast('Número do WhatsApp não disponível', 'error');
            }
        });
    }
    
    const emailButton = document.getElementById('email-button');
    if (emailButton) {
        emailButton.addEventListener('click', () => {
            if (prestadorAtual && prestadorAtual.email) {
                const assunto = `Solicitação de Serviço - ${prestadorAtual.categoria}`;
                const corpo = `Olá ${prestadorAtual.nome.split(' - ')[0]},\n\nGostaria de solicitar seu serviço de ${prestadorAtual.categoria}.\n\nAtenciosamente.`;
                enviarEmail(prestadorAtual.email, assunto, corpo);
            } else {
                showToast('E-mail não disponível', 'error');
            }
        });
    }
    
    // Atualizar serviços periodicamente se Firebase disponível
    if (isFirebaseAvailable()) {
        console.log('⏰ Configurando atualização periódica de serviços...');
        setInterval(async () => {
            if (!carregandoServicos) {
                console.log('🔄 Atualizando serviços automaticamente...');
                await carregarServicosFirestore();
                filtrarServicos(elements.servicesList);
            }
        }, 30000); // 30 segundos
    }
}

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado, iniciando aplicação...');
    // Pequeno delay para garantir que todos os elementos estejam carregados
    setTimeout(() => {
        init().catch(error => {
            console.error('❌ Erro na inicialização:', error);
            showToast('Erro ao inicializar aplicação: ' + error.message, 'error');
            
            // Mostrar estado de erro
            const servicesList = document.getElementById('services-list');
            if (servicesList) {
                servicesList.innerHTML = `
                    <div class="empty-state">
                        <span class="material-icons empty-state-icon">error</span>
                        <p class="empty-state-text">Erro ao carregar serviços</p>
                        <p style="color: var(--text-light); font-size: 14px; margin-top: 8px;">
                            ${error.message || 'Tente recarregar a página'}
                        </p>
                        <button class="nav-button" style="margin-top: 16px;" onclick="location.reload()">
                            <span class="material-icons">refresh</span>
                            Recarregar Página
                        </button>
                    </div>
                `;
            }
        });
    }, 500);
});

// Exportar funções para uso global
window.showToast = showToast;
window.isFirebaseAvailable = isFirebaseAvailable;
window.filtrarServicos = function(sortBy = '') {
    const servicesList = document.getElementById('services-list');
    if (servicesList) {
        filtrarServicos(servicesList, sortBy);
    }
};

// Log de inicialização
console.log('🔄 Script.js carregado');