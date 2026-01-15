// avaliacoes.js - Visualizar avaliações

class AvaliacoesViewer {
    constructor() {
        this.prestadorId = null;
        this.prestadorNome = '';
        this.avaliacoes = [];
        this.loading = true;
    }

    async init() {
        // Obter parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        this.prestadorId = urlParams.get('prestadorId');

        if (!this.prestadorId) {
            this.showError('ID do prestador não fornecido');
            return;
        }

        // Mostrar estado de carregamento inicial (igual ao avaliacao.html)
        this.showLoadingState();
        
        // Esconder overlay de carregamento se existir
        this.hideLoadingOverlay();
        
        // Atualizar status do carregamento
        this.updateLoadingStatus('Inicializando sistema...');

        try {
            await this.loadPrestadorInfo();
            this.updateLoadingStatus('Carregando avaliações...');
            await this.loadAvaliacoes();
            
            // Pequeno delay para melhor experiência do usuário
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Esconder loading e mostrar conteúdo
            this.hideLoadingState();
            this.showMainContent();
            
            // Renderizar conteúdo
            this.renderStats();
            this.renderAvaliacoes();
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.hideLoadingState();
            this.showError('Erro ao carregar avaliações. Tente novamente.');
        }
    }

    // Função para mostrar estado de carregamento inicial (igual ao avaliacao.html)
    showLoadingState() {
        const loadingContent = document.getElementById('loading-content');
        const mainContent = document.getElementById('main-content');
        
        if (loadingContent) {
            loadingContent.style.display = 'block';
            loadingContent.innerHTML = `
                <div class="loading-state">
                    <h1>Avaliações</h1>
                    <div class="loading-content">
                        <span class="material-icons loading">refresh</span>
                        <p id="loading-text">Carregando avaliações...</p>
                    </div>
                </div>
            `;
        }
        
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        this.loading = true;
    }

    // Função para esconder estado de carregamento
    hideLoadingState() {
        const loadingContent = document.getElementById('loading-content');
        if (loadingContent) {
            loadingContent.style.display = 'none';
        }
        this.loading = false;
    }

    // Função para mostrar conteúdo principal
    showMainContent() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.classList.remove('content-loading');
            mainContent.style.animation = 'fadeIn 0.5s ease';
        }
    }

    // Função para atualizar texto de carregamento
    updateLoadingStatus(message) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        // Também atualizar no overlay se existir
        const loadingSubtext = document.getElementById('loading-subtext');
        if (loadingSubtext) {
            loadingSubtext.textContent = message;
        }
    }

    // Função para esconder overlay de carregamento
    hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
    }

    // ADICIONAR: Função para verificar Firebase
    checkFirebaseReady() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK não carregado');
            this.updateLoadingStatus('Aguardando Firebase...');
            return false;
        }
        
        if (!window.firebaseDb) {
            console.log('Firestore não disponível, tentando inicializar...');
            this.updateLoadingStatus('Inicializando banco de dados...');
            
            // Tentar inicializar se não estiver
            if (typeof initializeFirebase === 'function') {
                initializeFirebase();
            } else if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                // Configuração básica do Firebase
                const firebaseConfig = {
                    apiKey: "AIzaSyDnFkFgDhAhC9iftYNFhXdzuKB3UBE_BSw",
                    authDomain: "clickservicos-34a9d.firebaseapp.com",
                    projectId: "clickservicos-34a9d",
                    storageBucket: "clickservicos-34a9d.firebasestorage.app",
                    messagingSenderId: "104678131910",
                    appId: "1:104678131910:web:faa437799bda30a631efc7",
                    measurementId: "G-Q3WTZGNQK6"
                };
                
                try {
                    firebase.initializeApp(firebaseConfig);
                    window.firebaseDb = firebase.firestore();
                    window.firebaseAuth = firebase.auth();
                    console.log('Firebase inicializado manualmente');
                    this.updateLoadingStatus('Banco de dados conectado!');
                } catch (error) {
                    console.error('Erro ao inicializar Firebase:', error);
                    return false;
                }
            }
            
            return window.firebaseDb !== null && window.firebaseDb !== undefined;
        }
        
        this.updateLoadingStatus('Banco de dados pronto!');
        return true;
    }

    async loadPrestadorInfo() {
        try {
            if (!this.checkFirebaseReady()) {
                console.warn('Firebase não está disponível, usando nome padrão');
                this.prestadorNome = 'Prestador de Serviços';
                document.title = `Avaliações - ${this.prestadorNome}`;
                
                // Atualizar título da página
                const titleElement = document.getElementById('page-title');
                if (titleElement) {
                    titleElement.textContent = `Avaliações - ${this.prestadorNome}`;
                }
                return;
            }

            this.updateLoadingStatus('Buscando informações do prestador...');

            const prestadorDoc = await window.firebaseDb.collection('prestadores')
                .doc(this.prestadorId)
                .get();

            if (prestadorDoc.exists) {
                const data = prestadorDoc.data();
                this.prestadorNome = data.nome || 'Prestador';
                document.title = `Avaliações - ${this.prestadorNome}`;
                
                // Atualizar título da página
                const titleElement = document.getElementById('page-title');
                if (titleElement) {
                    titleElement.textContent = `Avaliações - ${this.prestadorNome}`;
                }
                
                this.updateLoadingStatus(`Carregando avaliações de ${this.prestadorNome}...`);
            } else {
                this.prestadorNome = 'Prestador';
                document.title = `Avaliações - ${this.prestadorNome}`;
                const titleElement = document.getElementById('page-title');
                if (titleElement) {
                    titleElement.textContent = `Avaliações`;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar informações do prestador:', error);
            this.prestadorNome = 'Prestador de Serviços';
            this.updateLoadingStatus('Usando informações básicas...');
        }
    }

    async loadAvaliacoes() {
        try {
            if (!this.checkFirebaseReady()) {
                throw new Error('Firebase não está disponível');
            }

            // ADICIONAR: Verificar se Firestore está disponível
            if (!window.firebaseDb || !window.firebaseDb.collection) {
                throw new Error('Banco de dados não disponível');
            }

            console.log(`Buscando avaliações para o prestador: ${this.prestadorId}`);
            this.updateLoadingStatus('Consultando banco de dados...');
            
            const querySnapshot = await window.firebaseDb.collection('avaliacoes')
                .where('prestadorId', '==', this.prestadorId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            this.avaliacoes = [];
            this.updateLoadingStatus(`Processando ${querySnapshot.size} avaliações...`);
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                // ADICIONAR: Garantir que os dados estejam completos
                if (data && data.rating && data.clienteNome) {
                    this.avaliacoes.push({
                        id: doc.id,
                        ...data,
                        // ADICIONAR: Formatar data corretamente
                        date: data.timestamp ? 
                            new Date(data.timestamp).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 
                            new Date().toLocaleDateString('pt-BR')
                    });
                } else {
                    console.warn('Avaliação com dados incompletos:', data);
                }
            });

            console.log(`✅ ${this.avaliacoes.length} avaliações carregadas para o prestador ${this.prestadorId}`);
            this.updateLoadingStatus(`${this.avaliacoes.length} avaliações encontradas!`);

        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
            
            // ADICIONAR: Mensagem de erro mais detalhada
            let errorMessage = 'Erro ao carregar avaliações';
            if (error.code === 'failed-precondition') {
                errorMessage += '. É necessário criar um índice no Firestore para essa consulta.';
            } else if (error.message.includes('permission')) {
                errorMessage += '. Permissão negada. Verifique as regras do Firestore.';
            } else {
                errorMessage += ': ' + error.message;
            }
            
            this.updateLoadingStatus('Erro ao carregar. Tentando novamente...');
            
            // ADICIONAR: Usar dados de exemplo em caso de erro
            if (this.avaliacoes.length === 0) {
                console.log('Usando avaliações de exemplo');
                this.avaliacoes = this.getSampleAvaliacoes();
            }
            
            throw error;
        }
    }
    
    // ADICIONAR: Método para dados de exemplo
    getSampleAvaliacoes() {
        return [
            {
                id: 'sample1',
                clienteNome: 'Cliente Exemplo 1',
                rating: 5,
                comment: 'Excelente serviço, muito profissional!',
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('pt-BR')
            },
            {
                id: 'sample2',
                clienteNome: 'Cliente Exemplo 2',
                rating: 4,
                comment: 'Bom trabalho, mas atrasou um pouco.',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                date: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR')
            }
        ];
    }

    calculateStats() {
        if (this.avaliacoes.length === 0) {
            return {
                average: 0,
                count: 0,
                distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            };
        }

        let total = 0;
        const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

        this.avaliacoes.forEach(avaliacao => {
            if (avaliacao.rating >= 1 && avaliacao.rating <= 5) {
                total += avaliacao.rating;
                distribution[avaliacao.rating]++;
            }
        });

        return {
            average: this.avaliacoes.length > 0 ? total / this.avaliacoes.length : 0,
            count: this.avaliacoes.length,
            distribution: distribution
        };
    }

    renderStats() {
        const stats = this.calculateStats();
        const statsContainer = document.getElementById('rating-stats');
        
        if (!statsContainer) return;

        let distributionHtml = '';
        for (let i = 5; i >= 1; i--) {
            const count = stats.distribution[i] || 0;
            const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
            
            distributionHtml += `
                <div class="rating-bar">
                    <div class="rating-bar-label">${i} estrela${i > 1 ? 's' : ''}</div>
                    <div class="rating-bar-progress">
                        <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="rating-bar-count">${count}</div>
                </div>
            `;
        }

        statsContainer.innerHTML = `
            <div class="info-card">
                <div class="info-card-content">
                    <div class="rating-stats">
                        <div class="rating-average">${stats.average.toFixed(1)}</div>
                        <div>
                            <div class="rating-stars-container">
                                ${this.renderStars(stats.average)}
                            </div>
                            <div class="rating-count">${stats.count} avaliação${stats.count !== 1 ? 'ões' : ''}</div>
                        </div>
                    </div>
                    
                    <div class="rating-distribution">
                        ${distributionHtml}
                    </div>
                    
                    <div style="margin-top: 16px; text-align: center;">
                        <a href="avaliacao.html?prestadorId=${this.prestadorId}&prestadorNome=${encodeURIComponent(this.prestadorNome)}" 
                           class="nav-button" style="display: inline-flex; align-items: center; gap: 8px;">
                            <span class="material-icons">star</span>
                            Avaliar este prestador
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHtml += '<span class="material-icons" style="color: #ffa000;">star</span>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHtml += '<span class="material-icons" style="color: #ffa000;">star_half</span>';
            } else {
                starsHtml += '<span class="material-icons" style="color: #ddd;">star_border</span>';
            }
        }
        return starsHtml;
    }

    renderAvaliacoes() {
        const container = document.getElementById('avaliacoes-list');
        if (!container) return;

        if (this.avaliacoes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">reviews</span>
                    <p>Nenhuma avaliação ainda</p>
                    <p style="color: var(--text-light); font-size: 14px; margin-top: 8px;">
                        Seja o primeiro a avaliar este prestador
                    </p>
                    <a href="avaliacao.html?prestadorId=${this.prestadorId}&prestadorNome=${encodeURIComponent(this.prestadorNome)}" 
                       class="nav-button" style="margin-top: 16px;">
                        <span class="material-icons">star</span>
                        Avaliar este prestador
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.avaliacoes.map(avaliacao => `
            <div class="info-card avaliacao-item" style="animation: fadeIn 0.5s ease;">
                <div class="avaliacao-header">
                    <div class="avaliacao-cliente">${avaliacao.clienteNome || 'Cliente'}</div>
                    <div class="avaliacao-data">${avaliacao.date || 'Data não disponível'}</div>
                </div>
                
                <div class="avaliacao-stars">
                    ${this.renderStars(avaliacao.rating || 0)}
                </div>
                
                ${avaliacao.comment ? `
                    <div class="avaliacao-comment">${avaliacao.comment}</div>
                ` : '<div class="avaliacao-comment" style="color: var(--text-light); font-style: italic;">Sem comentário</div>'}
            </div>
        `).join('');
    }

    showError(message) {
        this.hideLoadingState();
        
        // Mostrar o conteúdo principal mesmo em erro
        this.showMainContent();
        
        const container = document.getElementById('avaliacoes-list');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <span class="material-icons">error</span>
                    <p class="error-message">${message}</p>
                    <a href="index.html" class="nav-button" style="margin-top: 16px;">
                        <span class="material-icons">home</span>
                        Voltar para Início
                    </a>
                </div>
            `;
        }
        
        // Limpar estatísticas se houver erro
        const statsContainer = document.getElementById('rating-stats');
        if (statsContainer) {
            statsContainer.innerHTML = '';
        }
    }
}

// ADICIONAR: Função global showToast se não existir
if (typeof window !== 'undefined' && !window.showToast) {
    window.showToast = function(message, type = 'info') {
        // Criar toast se não existir
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
    };
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM carregado, iniciando sistema de avaliações...');
    
    // Pequeno delay para melhor experiência visual
    setTimeout(async () => {
        try {
            const viewer = new AvaliacoesViewer();
            await viewer.init();
        } catch (error) {
            console.error('❌ Erro fatal na inicialização:', error);
            
            // Mostrar erro ao usuário
            const loadingContent = document.getElementById('loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div class="error-state" style="text-align: center;">
                        <span class="material-icons" style="font-size: 64px; color: #f44336;">error</span>
                        <p class="error-message" style="margin: 16px 0;">Erro ao carregar página</p>
                        <p style="color: var(--text-light); font-size: 14px; margin-bottom: 24px;">
                            ${error.message || 'Tente recarregar a página'}
                        </p>
                        <button class="nav-button" onclick="location.reload()">
                            <span class="material-icons">refresh</span>
                            Recarregar Página
                        </button>
                    </div>
                `;
            }
        }
    }, 100);
});