// avaliacao.js - Sistema de avaliação de prestadores

class AvaliacaoSystem {
    constructor() {
        this.currentRating = 0;
        this.hoverRating = 0;
        this.prestadorId = null;
        this.prestadorNome = '';
        this.servicoId = null;
    }

    async init() {
        // Obter parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        this.prestadorId = urlParams.get('prestadorId');
        this.prestadorNome = decodeURIComponent(urlParams.get('prestadorNome') || 'Prestador');
        this.servicoId = urlParams.get('servicoId');

        if (!this.prestadorId) {
            this.showError('ID do prestador não fornecido');
            return;
        }

        // Mostrar estado de carregamento inicial
        this.showLoadingState();
        
        await this.loadPrestadorInfo();
        this.setupEventListeners();
    }

    // Função para mostrar estado de carregamento
    showLoadingState() {
        const ratingContent = document.getElementById('rating-content');
        ratingContent.innerHTML = `
            <div class="loading-state">
                <h1>Avaliar Serviço</h1>
                <div class="loading-content">
                    <span class="material-icons loading">refresh</span>
                    <p>Carregando informações do prestador...</p>
                </div>
            </div>
        `;
    }

    // ADICIONAR: Função melhorada para verificar Firebase
    checkFirebaseReady() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK não carregado');
            return false;
        }
        
        if (!window.firebaseDb) {
            console.log('Firestore não disponível, tentando inicializar...');
            
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
                } catch (error) {
                    console.error('Erro ao inicializar Firebase:', error);
                    return false;
                }
            }
            
            return window.firebaseDb !== null && window.firebaseDb !== undefined;
        }
        
        return true;
    }

    async loadPrestadorInfo() {
        try {
            if (!this.checkFirebaseReady()) {
                console.warn('Firebase não está disponível, usando fallback');
                this.renderPrestadorInfo({
                    categoria: 'Serviço',
                    nome: this.prestadorNome
                });
                return;
            }

            const prestadorDoc = await window.firebaseDb.collection('prestadores')
                .doc(this.prestadorId)
                .get();

            if (prestadorDoc.exists) {
                const data = prestadorDoc.data();
                this.prestadorNome = data.nome || this.prestadorNome;
                this.renderPrestadorInfo(data);
            } else {
                // Se não encontrar no Firestore, usar dados básicos
                this.renderPrestadorInfo({
                    categoria: 'Serviço',
                    nome: this.prestadorNome
                });
            }
        } catch (error) {
            console.error('Erro ao carregar informações do prestador:', error);
            // Fallback em caso de erro
            this.renderPrestadorInfo({
                categoria: 'Serviço',
                nome: this.prestadorNome
            });
        }
    }

    renderPrestadorInfo(data) {
        const ratingContent = document.getElementById('rating-content');
        
        // Se não houver dados ou dados incompletos, use valores padrão
        const prestadorNome = this.prestadorNome || data.nome || 'Prestador';
        const categoria = data.categoria || 'Serviço';
        
        ratingContent.innerHTML = `
            <h1>Avaliar Serviço</h1>
            
            <div class="info-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <span class="material-icons">person</span>
                    </div>
                    <h2 class="profile-name">${prestadorNome}</h2>
                    <div class="profile-category">${categoria}</div>
                </div>
            </div>

            <div class="info-card">
                <div class="info-card-header">Sua Avaliação</div>
                <div class="info-card-content">
                    <div class="rating-stars-container" id="rating-stars">
                        ${this.renderStars(0, true)}
                    </div>
                    <div class="rating-value" id="rating-value">
                        Selecione uma nota de 1 a 5 estrelas
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <label for="comment" class="form-label">Comentário (opcional)</label>
                        <textarea id="comment" class="form-input" rows="4" 
                                  placeholder="Compartilhe sua experiência com este serviço..."></textarea>
                    </div>
                    
                    <button class="contact-button" id="submit-rating" 
                            style="background-color: var(--primary-color); margin-top: 20px; width: 100%;">
                        <span class="material-icons">star</span>
                        Enviar Avaliação
                    </button>
                </div>
            </div>
        `;
    }

    renderStars(rating, interactive = false) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const filled = i <= rating;
            starsHtml += `
                <span class="star ${interactive ? 'interactive' : ''} ${filled ? 'filled' : ''}" 
                      data-value="${i}">
                    <span class="material-icons">
                        ${filled ? 'star' : 'star_border'}
                    </span>
                </span>
            `;
        }
        return starsHtml;
    }

    setupEventListeners() {
        // Event listeners para estrelas
        const starsContainer = document.getElementById('rating-stars');
        if (starsContainer) {
            starsContainer.addEventListener('mouseover', (e) => {
                const star = e.target.closest('.star.interactive');
                if (star) {
                    const value = parseInt(star.dataset.value);
                    this.hoverRating = value;
                    this.updateStarsDisplay(value);
                }
            });

            starsContainer.addEventListener('mouseout', () => {
                this.updateStarsDisplay(this.currentRating);
                this.hoverRating = 0;
            });

            starsContainer.addEventListener('click', (e) => {
                const star = e.target.closest('.star.interactive');
                if (star) {
                    const value = parseInt(star.dataset.value);
                    this.currentRating = value;
                    this.updateStarsDisplay(value);
                    this.updateRatingText(value);
                }
            });
        }

        // Event listener para enviar avaliação
        const submitButton = document.getElementById('submit-rating');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                this.submitRating();
            });
        }
    }

    updateStarsDisplay(rating) {
        const stars = document.querySelectorAll('.star.interactive .material-icons');
        stars.forEach((star, index) => {
            const starValue = index + 1;
            star.textContent = starValue <= rating ? 'star' : 'star_border';
            star.parentElement.classList.toggle('filled', starValue <= rating);
        });
    }

    updateRatingText(rating) {
        const ratingTexts = [
            'Péssimo',
            'Ruim',
            'Regular',
            'Bom',
            'Excelente'
        ];
        const ratingValue = document.getElementById('rating-value');
        if (ratingValue) {
            ratingValue.textContent = ratingTexts[rating - 1] || 'Selecione uma nota';
            ratingValue.style.fontWeight = 'bold';
            ratingValue.style.color = 'var(--primary-color)';
        }
    }

    async submitRating() {
        if (this.currentRating === 0) {
            showToast('Por favor, selecione uma avaliação', 'error');
            return;
        }

        try {
            if (!this.checkFirebaseReady()) {
                throw new Error('Firebase não está disponível. Verifique sua conexão.');
            }

            // Obter dados do usuário atual
            let userData = {};
            
            // Verificar se navigation.js está disponível
            if (typeof navigation !== 'undefined' && navigation.getUserData) {
                try {
                    userData = await navigation.getUserData();
                } catch (error) {
                    console.log('Erro ao obter dados do navigation, usando fallback:', error);
                }
            }
            
            // Fallback para localStorage se navigation não disponível
            if (!userData.uid) {
                userData = {
                    uid: localStorage.getItem('userUid'),
                    nome: localStorage.getItem('userName') || 'Cliente',
                    email: localStorage.getItem('userEmail') || ''
                };
            }

            if (!userData.uid) {
                showToast('Você precisa estar logado para avaliar', 'error');
                // Redirecionar para login
                setTimeout(() => {
                    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
                }, 2000);
                return;
            }

            const comment = document.getElementById('comment')?.value.trim() || '';
            const timestamp = new Date().toISOString();

            // Criar objeto de avaliação
            const avaliacao = {
                prestadorId: this.prestadorId,
                clienteId: userData.uid,
                clienteNome: userData.nome || 'Cliente',
                clienteEmail: userData.email || '',
                rating: this.currentRating,
                comment: comment,
                timestamp: timestamp,
                servicoId: this.servicoId,
                dataAvaliacao: new Date().toISOString()
            };

            // Validar se Firebase está realmente disponível
            if (!window.firebaseDb || !window.firebaseDb.collection) {
                throw new Error('Banco de dados não disponível');
            }

            // Salvar avaliação no Firestore
            await window.firebaseDb.collection('avaliacoes').add(avaliacao);

            // Atualizar média do prestador
            await this.updatePrestadorRating(this.prestadorId);

            showToast('Avaliação enviada com sucesso! Obrigado pelo feedback.', 'success');

            // Redirecionar após 2 segundos
            setTimeout(() => {
                window.location.href = `avaliacoes.html?prestadorId=${this.prestadorId}`;
            }, 2000);

        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            showToast('Erro ao enviar avaliação: ' + error.message, 'error');
            
            // Se for erro de permissão, mostrar mensagem específica
            if (error.message.includes('permission') || error.message.includes('Permission')) {
                showToast('Permissão negada. Verifique se o Firestore está configurado corretamente.', 'error');
            }
        }
    }

    async updatePrestadorRating(prestadorId) {
        try {
            // Verificar se Firebase está disponível
            if (!window.firebaseDb || !window.firebaseDb.collection) {
                console.warn('Firestore não disponível para atualizar média');
                return;
            }

            // Buscar todas as avaliações do prestador
            const querySnapshot = await window.firebaseDb.collection('avaliacoes')
                .where('prestadorId', '==', prestadorId)
                .get();

            if (querySnapshot.empty) {
                console.log('Nenhuma avaliação encontrada para o prestador');
                return;
            }

            let totalRating = 0;
            let count = 0;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.rating) {
                    totalRating += data.rating;
                    count++;
                }
            });

            if (count === 0) {
                console.log('Nenhuma avaliação válida encontrada');
                return;
            }

            const media = totalRating / count;

            // Atualizar prestador com nova média
            await window.firebaseDb.collection('prestadores')
                .doc(prestadorId)
                .update({
                    avaliacaoMedia: parseFloat(media.toFixed(1)),
                    totalAvaliacoes: count,
                    ultimaAtualizacao: new Date().toISOString()
                });

            console.log(`✅ Média atualizada para ${media.toFixed(2)} (${count} avaliações)`);

        } catch (error) {
            console.error('Erro ao atualizar avaliação do prestador:', error);
            // Não mostrar erro ao usuário, apenas log
        }
    }

    showError(message) {
        const ratingContent = document.getElementById('rating-content');
        ratingContent.innerHTML = `
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
    const avaliacaoSystem = new AvaliacaoSystem();
    await avaliacaoSystem.init();
});