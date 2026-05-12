const APP_VERSION = '2.0';
const SUPABASE_URL = 'https://lomidyqleidipggrpkcv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbWlkeXFsZWlkaXBnZ3Jwa2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTg4MDYsImV4cCI6MjA5NDA5NDgwNn0.v9HWY6qiFxOgnS3YczF3lgiS20AdL_fB288fgNgOOCw';

let supabaseClient;

function initSupabase() {
  if (window.supabase && !supabaseClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

function verificarVersao() {
  const versaoSalva = localStorage.getItem('appVersion');
  if (versaoSalva !== APP_VERSION) {
    localStorage.setItem('appVersion', APP_VERSION);
    if (versaoSalva) {
      setTimeout(() => {
        if (confirm('Nova versão disponível! Clique em OK para atualizar o sistema.')) {
          window.location.reload(true);
        }
      }, 500);
    }
  }
}

let currentUser = null;
let currentPage = 'login';
let config = {
  votacao_ativa: 'SIM',
  resultado_ao_vivo: 'SIM',
  tema: 'LIGHT',
  nome_sistema: 'Agrocomputação FAZU 2026'
};
let avisos = [];
let categorias = [];
let professores = [];
let funcionarios = [];
let alunos = [];
let cronograma = [];
let votosDoAluno = [];
let resultados = [];
let todosOsVotos = [];
let modalAberto = null;
let modalVotacaoAberto = false;
let modalCronogramaAberto = null;
let adminTab = 'alunos';
let novoAluno = { nome: '', login: '', senha: '', admin: false };
let novoProfessor = { nome: '' };
let novoFuncionario = { nome: '' };
let modalEsqueceuSenha = false;
let customAlert = null;

const descricoesCronograma = {
  'Entrega documentos pendentes': 'Entregue todos os documentos pendentes na Secretaria Acadêmica. Verifique a lista de documentos no portal do aluno ou entre em contato com a secretaria.',
  'Requerimento Colação de Grau': 'Envie um e-mail para atendimento.secretaria@fazu.br informando seu nome completo, curso e interesse em participar da Colação de Grau.',
  'Lista homenageados por curso': 'Envie a lista dos homenageados eleitos pela turma para cinthia.caetano@fazu.br com cópia para secretaria.presidencia@fazu.br.',
  'Discurso Orador/Pais': 'Envie os textos dos discursos do orador e da mensagem aos pais para secretaria.presidencia@fazu.br até a data limite.',
  'Convite aos homenageados': 'A FAZU enviará os convites oficiais para os homenageados. Certifique-se que a lista foi enviada corretamente.',
  'Discurso Paraninfo': 'Solicite ao paraninfo que prepare seu discurso e envie para secretaria.presidencia@fazu.br até a data limite.',
  'Ensaio Colação de Grau': 'Ensaio obrigatório para todos os formandos. Venha com a beca e capelo. Local: Centro de Eventos da ABCZ.',
  'Solenidade Colação de Grau': 'O GRANDE DIA! Chegue entre 17h00 e 17h30 com a beca completa. Local: Centro de Eventos da ABCZ.'
};

const explicacoesCategorias = {
  'Paraninfo': 'Professor(a) escolhido(a) como padrinho/madrinha da turma, devido ao destaque no exercício da docência.',
  'Patrono': 'Professor(a) homenageado(a) pelas qualidades profissionais ou ideais da turma.',
  'Nome da Turma': 'Professor(a) referência para os formandos, homenageado pelo exemplo profissional e/ou acadêmico.',
  'Professor Homenageado': 'Professor(a) que se destacou por dedicação, carinho e proximidade com os alunos.',
  'Funcionário Homenageado': '1 por curso, reconhecido pela proximidade, afinidade e contribuições durante a graduação.',
  'Orador': '1 representante para todas as turmas. Texto de até 3.500 caracteres.',
  'Juramentista': '1 por curso. Texto oficial da FAZU, sem alterações.',
  'Mensagem aos Pais': '1 representante para todas as turmas. Texto de até 1.500 caracteres.'
};

async function initApp() {
  initSupabase();
  verificarVersao();
  console.log('Iniciando app...');
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker registrado com sucesso:', registration);
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  }
  
  const savedUser = localStorage.getItem('formaturaUser');
  console.log('Usuário salvo:', savedUser);
  
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      currentPage = 'home';
      await carregarDados();
    } catch (e) {
      console.error('Erro ao carregar usuário salvo:', e);
      localStorage.removeItem('formaturaUser');
    }
  }
  
  renderApp();
  lucide.createIcons();
}

async function fetchSupabase(table, filters = {}) {
  try {
    const sb = initSupabase();
    if (!sb) return { success: false, message: 'Supabase não inicializado' };
    
    let query = sb.from(table).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro no Supabase:', error);
      return { success: false, message: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro na conexão:', error);
    return { success: false, message: 'Erro de conexão' };
  }
}

async function insertSupabase(table, data) {
  try {
    const sb = initSupabase();
    if (!sb) return { success: false, message: 'Supabase não inicializado' };
    
    const { error } = await sb.from(table).insert(data);
    
    if (error) {
      console.error('Erro no Supabase:', error);
      return { success: false, message: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro na conexão:', error);
    return { success: false, message: 'Erro de conexão' };
  }
}

async function upsertVoto(data) {
  try {
    const sb = initSupabase();
    if (!sb) return { success: false, message: 'Supabase não inicializado' };
    
    const { data: existingVoto, error: fetchError } = await sb
      .from('votacoes')
      .select('*')
      .eq('aluno', data.aluno)
      .eq('categoria', data.categoria);
    
    if (fetchError) {
      console.error('Erro no Supabase:', fetchError);
      return { success: false, message: fetchError.message };
    }
    
    if (existingVoto && existingVoto.length > 0) {
      const { error } = await sb
        .from('votacoes')
        .update({ voto: data.voto, timestamp: data.timestamp })
        .eq('id', existingVoto[0].id);
      
      if (error) {
        console.error('Erro no Supabase:', error);
        return { success: false, message: error.message };
      }
    } else {
      const { error } = await sb
        .from('votacoes')
        .insert(data);
      
      if (error) {
        console.error('Erro no Supabase:', error);
        return { success: false, message: error.message };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro na conexão:', error);
    return { success: false, message: 'Erro de conexão' };
  }
}

async function carregarDados() {
  console.log('=== Carregando dados do Supabase ===');
  
  const [configRes, avisosRes, categoriasRes, professoresRes, funcionariosRes, alunosRes, cronogramaRes] = await Promise.all([
    fetchSupabase('config'),
    fetchSupabase('avisos'),
    fetchSupabase('categorias'),
    fetchSupabase('professores'),
    fetchSupabase('funcionarios'),
    fetchSupabase('alunos'),
    fetchSupabase('cronograma')
  ]);
  
  console.log('Config:', configRes);
  console.log('Professores:', professoresRes);
  console.log('Alunos:', alunosRes);
  console.log('Funcionários:', funcionariosRes);
  
  if (configRes.success && configRes.data) {
    configRes.data.forEach(item => {
      config[item.chave] = item.valor;
    });
  }
  if (avisosRes.success) avisos = avisosRes.data || [];
  if (categoriasRes.success) categorias = categoriasRes.data || [];
  if (professoresRes.success) professores = professoresRes.data || [];
  if (funcionariosRes.success) funcionarios = funcionariosRes.data || [];
  if (alunosRes.success) alunos = alunosRes.data || [];
  if (cronogramaRes.success) cronograma = cronogramaRes.data || [];
  
  console.log('Professores carregados:', professores);
  console.log('Alunos carregados:', alunos);
  
  if (currentUser) {
    const votosRes = await fetchSupabase('votacoes', { aluno: currentUser.nome });
    if (votosRes.success) votosDoAluno = votosRes.data || [];
    
    if (config.resultado_ao_vivo === 'SIM') {
      resultados = await calcularResultados();
    }
    
    if (isAdmin()) {
      const todosVotosRes = await fetchSupabase('votacoes');
      if (todosVotosRes.success) todosOsVotos = todosVotosRes.data || [];
    }
  }
}

async function calcularResultados() {
  const votosRes = await fetchSupabase('votacoes');
  if (!votosRes.success || !votosRes.data) return [];
  
  const contagem = {};
  votosRes.data.forEach(voto => {
    const categoria = voto.categoria;
    const votoNome = voto.voto;
    
    if (categoria && votoNome) {
      if (!contagem[categoria]) contagem[categoria] = {};
      if (!contagem[categoria][votoNome]) contagem[categoria][votoNome] = 0;
      contagem[categoria][votoNome]++;
    }
  });
  
  const resultados = [];
  Object.entries(contagem).forEach(([categoria, votos]) => {
    let maxVotos = 0;
    let vencedor = '';
    Object.entries(votos).forEach(([nome, qtd]) => {
      if (qtd > maxVotos) {
        maxVotos = qtd;
        vencedor = nome;
      }
    });
    if (vencedor) {
      resultados.push({
        cargo: categoria,
        nome: vencedor,
        votos: maxVotos
      });
    }
  });
  
  return resultados;
}

function isAdmin() {
  return currentUser && (currentUser.nome === 'DAVID COSTA CAMPOS DE ALMEIDA' || currentUser.admin);
}

function getOpcoesPorCategoria(categoria) {
  console.log('=== getOpcoesPorCategoria ===');
  console.log('Categoria:', categoria);
  console.log('votosDoAluno:', votosDoAluno);
  
  const mapCategoriaParaAba = {
    'Paraninfo': professores,
    'Patrono': professores,
    'Nome da Turma': professores,
    'Professor Homenageado': professores,
    'Funcionário Homenageado': funcionarios,
    'Orador': alunos,
    'Juramentista': alunos,
    'Mensagem aos Pais': alunos
  };
  
  let dados = mapCategoriaParaAba[categoria] || [];
  console.log('Dados originais:', dados);
  
  if (['Orador', 'Juramentista', 'Mensagem aos Pais'].includes(categoria)) {
    dados = dados.filter(item => item.nome !== 'Administrador');
    console.log('Dados após remover Administrador:', dados);
  }
  
  const categoriasProfessor = ['Paraninfo', 'Patrono', 'Nome da Turma', 'Professor Homenageado'];
  if (categoriasProfessor.includes(categoria)) {
    const outrasCategoriasVotadas = votosDoAluno.filter(voto => voto.categoria !== categoria);
    const nomesProfessoresJaVotados = outrasCategoriasVotadas.map(voto => voto.voto);
    console.log('Professores já votados em outras categorias:', nomesProfessoresJaVotados);
    dados = dados.filter(item => !nomesProfessoresJaVotados.includes(item.nome));
    console.log('Dados após filtrar professores já votados:', dados);
  }
  
  const opcoes = dados.map(item => item.nome);
  console.log('Opções finais:', opcoes);
  
  return opcoes;
}

function renderApp() {
  const app = document.getElementById('app');
  
  let content = '';
  if (currentPage === 'login') {
    content = renderLoginPage();
  } else {
    content = renderMainApp();
  }
  
  app.innerHTML = content + (customAlert ? renderCustomAlert() : '');
  lucide.createIcons();
}

function renderCustomAlert() {
  return `
    <div class="custom-alert-overlay" onclick="fecharCustomAlert()">
      <div class="custom-alert" onclick="event.stopPropagation()">
        <div class="custom-alert-icon" style="background: ${customAlert.type === 'success' ? 'rgba(39, 174, 96, 0.15)' : customAlert.type === 'error' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(33, 150, 243, 0.15)'}; color: ${customAlert.type === 'success' ? 'var(--primary)' : customAlert.type === 'error' ? '#ef5350' : '#64b5f6'};">
          <i data-lucide="${customAlert.type === 'success' ? 'check-circle' : customAlert.type === 'error' ? 'x-circle' : 'info'}"></i>
        </div>
        <div class="custom-alert-content">
          <h3 style="color: var(--text); margin-bottom: 8px;">${customAlert.titulo}</h3>
          <p style="color: var(--text-light);">${customAlert.mensagem}</p>
        </div>
        <button class="custom-alert-btn" onclick="fecharCustomAlert()">OK</button>
      </div>
    </div>
  `;
}

function mostrarAlerta(titulo, mensagem, tipo = 'info') {
  customAlert = { titulo, mensagem, tipo };
  renderApp();
}

function fecharCustomAlert() {
  customAlert = null;
  renderApp();
}

function renderLoginPage() {
  return `
    <div class="login-container">
      <div class="login-card">
        <img src="logo_agrocomputacao.png" class="logo">
        <h1>Agrocomputação FAZU 2026</h1>
        <p class="subtitle">Sistema Oficial da Turma</p>
        <div class="input-group">
          <label>Login</label>
          <input type="text" id="login" placeholder="Digite seu login">
        </div>
        <div class="input-group">
          <label>Senha</label>
          <div class="password-input-wrapper">
            <input type="password" id="senha" placeholder="Digite sua senha">
            <button type="button" class="toggle-password" onclick="toggleSenha()">
              <i data-lucide="eye" id="eye-icon"></i>
            </button>
          </div>
        </div>
        <div style="margin-bottom:20px;text-align:center;">
          <a href="#" style="color:var(--primary);text-decoration:none;font-size:14px;" onclick="event.preventDefault();abrirModalEsqueceuSenha()">Esqueceu sua senha?</a>
        </div>
        <button id="login-btn" onclick="handleLogin()">Entrar</button>
      </div>
      ${modalEsqueceuSenha ? renderModalEsqueceuSenha() : ''}
    </div>
  `;
}

function renderModalEsqueceuSenha() {
  return `
    <div class="modal-overlay" onclick="fecharModalEsqueceuSenha()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Esqueceu sua senha?</h2>
          <button class="modal-close" onclick="fecharModalEsqueceuSenha()">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-content">
          <div style="background:rgba(39,174,96,0.08);border:1px solid rgba(39,174,96,0.2);border-radius:14px;padding:20px;margin-bottom:20px;">
            <h4 style="color:var(--primary);margin-bottom:15px;display:flex;align-items:center;gap:10px;"><i data-lucide="info"></i> Como recuperar a senha?</h4>
            <p style="color:var(--text);font-size:14px;line-height:1.6;">Para resetar sua senha, entre em contato diretamente com o administrador:</p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <p style="color:var(--text-light);margin-bottom:15px;"><i data-lucide="user" style="width:20px;height:20px;display:inline-block;margin-right:8px;"></i> <strong>Administrador:</strong> David Costa Campos de Almeida</p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
              <button class="btn-primary" style="width:auto;" onclick="compartilharWhatsApp('','Olá David! Preciso resetar minha senha do sistema de votações da formatura.')">
                <i data-lucide="message-circle" style="width:18px;height:18px;"></i> Contatar via WhatsApp
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="fecharModalEsqueceuSenha()">Fechar</button>
        </div>
      </div>
    </div>
  `;
}

function abrirModalEsqueceuSenha() {
  modalEsqueceuSenha = true;
  renderApp();
  lucide.createIcons();
}

function fecharModalEsqueceuSenha() {
  modalEsqueceuSenha = false;
  renderApp();
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function validarSenhaForte(password) {
  const erros = [];
  if (password.length < 6) erros.push('Pelo menos 6 caracteres');
  if (!/[A-Z]/.test(password)) erros.push('Letra maiúscula');
  if (!/[a-z]/.test(password)) erros.push('Letra minúscula');
  if (!/[0-9]/.test(password)) erros.push('Número');
  return erros;
}

function renderMainApp() {
  const isAdminUser = isAdmin();
  
  return `
    <div class="app-container">
      <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <img src="logo_agrocomputacao.png" class="sidebar-logo">
          <h2>${config.nome_sistema || 'Agrocomputação FAZU 2026'}</h2>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-item ${currentPage === 'home' ? 'active' : ''}" onclick="navigateTo('home')">
            <i data-lucide="home"></i>
            <span>Home</span>
          </div>
          <div class="nav-item ${currentPage === 'votacoes' ? 'active' : ''}" onclick="navigateTo('votacoes')">
            <i data-lucide="vote"></i>
            <span>Votações</span>
          </div>
          <div class="nav-item ${currentPage === 'cronograma' ? 'active' : ''}" onclick="navigateTo('cronograma')">
            <i data-lucide="calendar"></i>
            <span>Cronograma</span>
          </div>
          <div class="nav-item ${currentPage === 'homenageados' ? 'active' : ''}" onclick="navigateTo('homenageados')">
            <i data-lucide="award"></i>
            <span>Homenageados</span>
          </div>
          <div class="nav-item ${currentPage === 'documentos' ? 'active' : ''}" onclick="navigateTo('documentos')">
            <i data-lucide="help-circle"></i>
            <span>Dúvidas</span>
          </div>
          ${isAdminUser ? `
            <div style="margin-top:20px;padding:10px 15px;color:var(--primary);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">ADMINISTRAÇÃO</div>
            <div class="nav-item ${currentPage === 'admin-votos' ? 'active' : ''}" onclick="navigateTo('admin-votos')">
              <i data-lucide="bar-chart-3"></i>
              <span>Ver Todos os Votos</span>
            </div>
            <div class="nav-item ${currentPage === 'admin-relatorios' ? 'active' : ''}" onclick="navigateTo('admin-relatorios')">
              <i data-lucide="file-spreadsheet"></i>
              <span>Relatórios</span>
            </div>
            <div class="nav-item ${currentPage === 'admin-usuarios' ? 'active' : ''}" onclick="navigateTo('admin-usuarios')">
              <i data-lucide="users"></i>
              <span>Gerenciar Usuários</span>
            </div>
            <div class="nav-item ${currentPage === 'admin-config' ? 'active' : ''}" onclick="navigateTo('admin-config')">
              <i data-lucide="settings"></i>
              <span>Configurações</span>
            </div>
          ` : ''}
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <i data-lucide="user-circle"></i>
            <div>
              <p class="user-name">${currentUser?.nome || 'Usuário'}</p>
              <p class="user-role">${isAdminUser ? 'Administrador' : 'Aluno'}</p>
            </div>
          </div>
          <button class="logout-btn" onclick="handleLogout()">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </div>
      
      <div class="main-content">
        <button class="menu-toggle" onclick="toggleSidebar()">
          <i data-lucide="menu"></i>
        </button>
        ${renderCurrentPage()}
        ${modalAberto ? renderModal() : ''}
      </div>
    </div>
  `;
}

function renderCurrentPage() {
  switch (currentPage) {
    case 'home': return renderHomePage();
    case 'votacoes': return renderVotacoesPage();
    case 'cronograma': return renderCronogramaPage();
    case 'homenageados': return renderHomenageadosPage();
    case 'documentos': return renderDocumentosPage();
    case 'admin-votos': return renderAdminVotosPage();
    case 'admin-relatorios': return renderAdminRelatoriosPage();
    case 'admin-usuarios': return renderAdminUsuariosPage();
    case 'admin-config': return renderAdminConfigPage();
    default: return renderHomePage();
  }
}

function renderHomePage() {
  const dataColacao = new Date('2026-07-30');
  const hoje = new Date();
  const diffTime = dataColacao - hoje;
  const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const categoriasConcluidas = votosDoAluno.length;
  const totalCategorias = categorias.length || 8;
  
  const pendentes = categorias.filter(cat => 
    !votosDoAluno.some(v => v.categoria === cat.categoria)
  );
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Bem-vindo, ${currentUser?.nome || 'Aluno'}!</h1>
        <p>Confira as últimas atualizações da turma</p>
      </div>
      
      <div class="cards-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="clock"></i>
          </div>
          <div class="stat-info">
            <p class="stat-label">Dias para Colação</p>
            <p class="stat-value">${diffDias}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="vote"></i>
          </div>
          <div class="stat-info">
            <p class="stat-label">Votações</p>
            <p class="stat-value">${categoriasConcluidas}/${totalCategorias}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="calendar"></i>
          </div>
          <div class="stat-info">
            <p class="stat-label">Próximo Evento</p>
            <p class="stat-value" style="font-size:18px;">Ensaio</p>
          </div>
        </div>
      </div>
      
      ${avisos.length > 0 ? `
        <div class="alert-box">
          <div class="alert-icon">
            <i data-lucide="bell"></i>
          </div>
          <div class="alert-content">
            ${avisos.map(a => `
              <div style="margin-bottom:10px;">
                <h3 style="font-size:16px;">${a.titulo}</h3>
                <p style="font-size:14px;">${a.mensagem}</p>
                <small style="color:#856404;">${a.data || ''}</small>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${pendentes.length > 0 ? `
        <div class="alert-box" style="background:rgba(33, 150, 243, 0.1); border:1px solid rgba(33, 150, 243, 0.2);">
          <div class="alert-icon" style="background:rgba(33, 150, 243, 0.2); color:#64b5f6;">
            <i data-lucide="alert-triangle"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#64b5f6;">Você possui votações pendentes!</h3>
            <ul style="color:#bbdefb;">
              ${pendentes.map(p => `<li style="color:#bbdefb;">${p.categoria}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      <div class="menu-grid">
        <div class="menu-item" onclick="navigateTo('votacoes')">
          <i data-lucide="vote"></i>
          <h3>Votações</h3>
          <p>Participe das votações da turma</p>
        </div>
        <div class="menu-item" onclick="navigateTo('cronograma')">
          <i data-lucide="calendar"></i>
          <h3>Cronograma</h3>
          <p>Veja todas as datas importantes</p>
        </div>
        <div class="menu-item" onclick="navigateTo('homenageados')">
          <i data-lucide="award"></i>
          <h3>Homenageados</h3>
          <p>Veja os resultados das votações</p>
        </div>
        <div class="menu-item" onclick="navigateTo('documentos')">
          <i data-lucide="help-circle"></i>
          <h3>Dúvidas</h3>
          <p>Orientações e traje oficial</p>
        </div>
      </div>
    </div>
  `;
}

function renderVotacoesPage() {
  const votacaoAtiva = config.votacao_ativa === 'SIM';
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Votações</h1>
        <p>Participe das decisões da turma</p>
      </div>
      
      ${!votacaoAtiva ? `
        <div class="alert-box" style="background:rgba(244, 67, 54, 0.1); border:1px solid rgba(244, 67, 54, 0.2);">
          <div class="alert-icon" style="background:rgba(244, 67, 54, 0.2); color:#ef5350;">
            <i data-lucide="lock"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#ef5350;">Votações encerradas</h3>
            <p style="color:#ffcdd2;">As votações estão temporariamente desativadas.</p>
          </div>
        </div>
      ` : ''}
      
      <div class="votacoes-list">
        ${(categorias.length > 0 ? categorias : [
          { id: 1, categoria: 'Paraninfo', status: 'ABERTO' },
          { id: 2, categoria: 'Patrono', status: 'ABERTO' },
          { id: 3, categoria: 'Nome da Turma', status: 'ABERTO' },
          { id: 4, categoria: 'Professor Homenageado', status: 'ABERTO' },
          { id: 5, categoria: 'Funcionário Homenageado', status: 'ABERTO' },
          { id: 6, categoria: 'Orador', status: 'ABERTO' },
          { id: 7, categoria: 'Juramentista', status: 'ABERTO' },
          { id: 8, categoria: 'Mensagem aos Pais', status: 'ABERTO' }
        ]).map(cat => {
          const votoAtual = votosDoAluno.find(v => v.categoria === cat.categoria);
          const jaVotou = !!votoAtual;
          const status = jaVotou ? 'concluido' : (cat.status === 'ABERTO' ? 'pendente' : 'fechado');
          const podeVotar = votacaoAtiva && cat.status === 'ABERTO';
          
          return `
            <div class="votacao-card">
              <div class="votacao-info">
                <h3>${cat.categoria}</h3>
                <span class="votacao-status ${status}">
                  ${jaVotou ? 'Votado' : (cat.status === 'ABERTO' ? 'Aberto' : 'Fechado')}
                </span>
                ${jaVotou ? `<p style="margin-top:8px;color:var(--text-light);font-size:14px;"><i data-lucide="check-circle" style="width:16px;height:16px;color:var(--primary);display:inline-block;margin-right:5px;"></i> Seu voto: ${votoAtual.voto}</p>` : ''}
              </div>
              <button class="votar-btn" ${!podeVotar ? 'disabled' : ''} onclick="abrirModalExplicacao('${cat.categoria}')">
                ${jaVotou ? 'Alterar Voto' : 'Votar'}
                <i data-lucide="chevron-right"></i>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderCronogramaPage() {
  const eventosOficiais = [
    { evento: 'Entrega documentos pendentes', data: 'Até 30/06/2026', local: 'Secretaria Acadêmica' },
    { evento: 'Requerimento Colação de Grau', data: '01/07/2026 a 15/07/2026', local: 'atendimento.secretaria@fazu.br' },
    { evento: 'Lista homenageados por curso', data: 'Até 10/07/2026', local: 'cinthia.caetano@fazu.br' },
    { evento: 'Discurso Orador/Pais', data: 'Até 10/07/2026', local: 'secretaria.presidencia@fazu.br' },
    { evento: 'Convite aos homenageados', data: '15/07/2026', local: 'FAZU enviará' },
    { evento: 'Discurso Paraninfo', data: 'Até 20/07/2026', local: 'secretaria.presidencia@fazu.br' },
    { evento: 'Ensaio Colação de Grau', data: '29/07/2026 às 15h30', local: 'Centro de Eventos da ABCZ' },
    { evento: 'Solenidade Colação de Grau', data: '30/07/2026 às 19h00', local: 'Centro de Eventos da ABCZ' }
  ];
  
  const eventos = cronograma.length > 0 ? cronograma : eventosOficiais;
  const googleMapsUrl = 'https://maps.app.goo.gl/DFaRztiY3NCmTAjf8';
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Cronograma Oficial</h1>
        <p>Datas importantes da colação de grau</p>
      </div>
      
      <div class="documento-card" style="margin-bottom:30px;">
        <h3 style="margin-bottom:20px;display:flex;align-items:center;gap:10px;"><i data-lucide="star"></i> O Grande Dia</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;">
          <div style="padding:15px;background:rgba(39,174,96,0.1);border-radius:12px;border:1px solid rgba(39,174,96,0.2);">
            <p style="color:var(--text-light);font-size:13px;margin-bottom:5px;">Data</p>
            <p style="font-weight:700;color:var(--primary);font-size:18px;">30/07/2026</p>
          </div>
          <div style="padding:15px;background:rgba(39,174,96,0.1);border-radius:12px;border:1px solid rgba(39,174,96,0.2);">
            <p style="color:var(--text-light);font-size:13px;margin-bottom:5px;">Horário</p>
            <p style="font-weight:700;color:var(--primary);font-size:18px;">19h</p>
          </div>
          <div style="padding:15px;background:rgba(39,174,96,0.1);border-radius:12px;border:1px solid rgba(39,174,96,0.2);">
            <p style="color:var(--text-light);font-size:13px;margin-bottom:5px;">Chegada dos Formandos</p>
            <p style="font-weight:700;color:var(--primary);font-size:18px;">17h00 - 17h30</p>
          </div>
          <div style="padding:15px;background:rgba(39,174,96,0.1);border-radius:12px;border:1px solid rgba(39,174,96,0.2);">
            <p style="color:var(--text-light);font-size:13px;margin-bottom:5px;">Local</p>
            <p style="font-weight:700;color:var(--primary);font-size:14px;">Centro de Eventos da ABCZ</p>
          </div>
        </div>
        <p style="margin-top:15px;color:var(--text-light);"><i data-lucide="map-pin"></i> Av. Barão do Rio Branco, 1717 - São Benedito, Uberaba – MG</p>
      </div>
      
      <div class="timeline">
        ${eventos.map((evento, index) => `
          <div class="timeline-item" style="cursor:pointer;" onclick="abrirModalCronograma('${evento.evento}')">
            <div class="timeline-dot"></div>
            <div class="timeline-card" style="transition:all 0.3s;">
              <div class="timeline-date">
                <i data-lucide="calendar"></i>
                <span>${evento.data}</span>
              </div>
              <h3>${evento.evento}</h3>
              <p class="timeline-local">
                <i data-lucide="map-pin"></i>
                ${evento.local}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${modalCronogramaAberto ? renderModalCronograma(googleMapsUrl) : ''}
    </div>
  `;
}

function renderModalCronograma(googleMapsUrl) {
  const evento = modalCronogramaAberto;
  const descricao = descricoesCronograma[evento] || 'Clique para ver mais detalhes.';
  const isLocalizacaoImportante = evento.includes('Ensaio') || evento.includes('Solenidade');
  
  return `
    <div class="modal-overlay" onclick="fecharModalCronograma()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>${evento}</h2>
          <button class="modal-close" onclick="fecharModalCronograma()">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-content">
          <div style="background:rgba(39,174,96,0.08);border:1px solid rgba(39,174,96,0.2);border-radius:14px;padding:18px;margin-bottom:20px;">
            <p style="color:var(--text);font-size:15px;line-height:1.6;">${descricao}</p>
          </div>
          
          ${isLocalizacaoImportante ? `
            <div style="margin-top:20px;">
              <h4 style="margin-bottom:15px;color:var(--primary);display:flex;align-items:center;gap:8px;"><i data-lucide="map-pin"></i> Localização</h4>
              <a href="${googleMapsUrl}" target="_blank" style="display:block;padding:15px;background:rgba(39,174,96,0.1);border:1px solid rgba(39,174,96,0.2);border-radius:12px;color:var(--text);text-decoration:none;margin-bottom:15px;transition:all 0.3s;" onmouseover="this.style.background='rgba(39,174,96,0.2)'" onmouseout="this.style.background='rgba(39,174,96,0.1)'">
                <i data-lucide="external-link" style="width:18px;height:18px;display:inline-block;margin-right:8px;"></i> Abrir no Google Maps
              </a>
              <button class="btn-primary" style="width:auto;margin-top:10px;" onclick="compartilharWhatsApp('${googleMapsUrl}','${evento}')">
                <i data-lucide="message-circle" style="width:18px;height:18px;"></i> Compartilhar no WhatsApp
              </button>
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="fecharModalCronograma()">Fechar</button>
        </div>
      </div>
    </div>
  `;
}

function abrirModalCronograma(evento) {
  modalCronogramaAberto = evento;
  renderApp();
  lucide.createIcons();
}

function fecharModalCronograma() {
  modalCronogramaAberto = null;
  renderApp();
}

function compartilharWhatsApp(url, evento) {
  const mensagem = encodeURIComponent(`${evento}\nLocalização: ${url}`);
  window.open(`https://wa.me/?text=${mensagem}`, '_blank');
}

function renderHomenageadosPage() {
  const mostrarResultados = config.resultado_ao_vivo === 'SIM';
  
  const dados = resultados.length > 0 ? resultados : [];
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Homenageados</h1>
        <p>Resultados das votações</p>
      </div>
      
      ${!mostrarResultados ? `
        <div class="alert-box" style="background:rgba(33, 150, 243, 0.1); border:1px solid rgba(33, 150, 243, 0.2);">
          <div class="alert-icon" style="background:rgba(33, 150, 243, 0.2); color:#64b5f6;">
            <i data-lucide="eye-off"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#64b5f6;">Resultados em breve</h3>
            <p style="color:#bbdefb;">Os resultados serão divulgados em breve.</p>
          </div>
        </div>
      ` : ''}
      
      ${dados.length > 0 ? `
        <div class="homenageados-grid">
          ${dados.map(h => `
            <div class="homenageado-card">
              <div class="homenageado-icon">
                <i data-lucide="user"></i>
              </div>
              <h3>${h.nome || 'A definir'}</h3>
              <p class="homenageado-cargo">${h.cargo}</p>
              ${h.votos ? `
                <div class="votos-info">
                  <i data-lucide="thumbs-up"></i>
                  <span>${h.votos} votos</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="alert-box" style="background:rgba(33, 150, 243, 0.1); border:1px solid rgba(33, 150, 243, 0.2);">
          <div class="alert-icon" style="background:rgba(33, 150, 243, 0.2); color:#64b5f6;">
            <i data-lucide="info"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#64b5f6;">Nenhum resultado ainda</h3>
            <p style="color:#bbdefb;">Aguarde os primeiros votos serem registrados.</p>
          </div>
        </div>
      `}
    </div>
  `;
}

function renderDocumentosPage() {
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Dúvidas e Orientações Oficiais</h1>
        <p>Todas as informações importantes para a colação</p>
      </div>
      
      <div class="documentos-section">
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="graduation-cap"></i>
          </div>
          <h3>Como funciona a Colação</h3>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Colação Coletiva</h4>
          <p style="margin-bottom:15px;">Sessão solene oficial para todos os formandos, com entrega pública do grau no Centro de Eventos.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Colação em Gabinete</h4>
          <p style="margin-bottom:15px;">Ocorre após a coletiva, em data e horário agendados pela FAZU.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Como requerer</h4>
          <p style="margin-bottom:10px;">Após o fechamento das notas (previsto para 10 de julho de 2026), o formando deve enviar e-mail para:</p>
          <p style="background:rgba(39,174,96,0.1);padding:10px;border-radius:8px;margin-bottom:10px;font-weight:700;color:var(--primary);">atendimento.secretaria@fazu.br</p>
          <p style="margin-bottom:10px;">Informando:</p>
          <ul>
            <li>Nome completo</li>
            <li>Curso</li>
            <li>Interesse em participar da Colação de Grau</li>
          </ul>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="check-circle"></i>
          </div>
          <h3>Quem pode participar?</h3>
          <p style="margin-bottom:15px;">Regularidade acadêmica, ENADE e documentação</p>
          <p style="margin-bottom:10px;">O aluno deve:</p>
          <ul>
            <li>Ter a matriz curricular integralizada (aprovado e com frequência)</li>
            <li>Cumprir carga horária</li>
            <li>Cumprir atividades extensionistas (quando aplicável)</li>
            <li>Cumprir atividades complementares</li>
            <li>Cumprir estágios (quando aplicável)</li>
            <li>Estar regular junto ao ENADE</li>
          </ul>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="shirt"></i>
          </div>
          <h3>Traje Oficial</h3>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Formandos</h4>
          <ul>
            <li>Beca preta de manga longa</li>
            <li>Jabeau branco</li>
            <li>Faixa na cor do curso</li>
            <li>Capelo preto</li>
          </ul>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Dicas importantes</h4>
          <ul>
            <li>Prefira calçados confortáveis</li>
            <li>Evite roupas claras sob a beca</li>
            <li>Pense no conforto durante toda a cerimônia</li>
          </ul>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Cores dos cursos</h4>
          <ul>
            <li>Agronomia — Azul escuro</li>
            <li>Agrocomputação — Azul escuro</li>
            <li>Agronegócio — Azul escuro</li>
            <li>Zootecnia — Verde bandeira</li>
          </ul>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="users"></i>
          </div>
          <h3>Comissão de Formatura</h3>
          <p style="margin-bottom:15px;">A Comissão de Formatura é o grupo de alunos escolhido pela turma para representar os colegas na organização e nos processos da colação.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Representante de Turma</h4>
          <p style="margin-bottom:15px;">Quando não houver comissão formada, a turma poderá indicar um representante.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Responsabilidades</h4>
          <ul>
            <li>Comunicação com a FAZU</li>
            <li>Organização dos eventos</li>
            <li>Definição de homenagens</li>
            <li>Contratação de fornecedores</li>
            <li>Alinhamento das informações com os colegas</li>
          </ul>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="party-popper"></i>
          </div>
          <h3>Eventos de Celebração</h3>
          <ul>
            <li>Aula da saudade</li>
            <li>Missa ou culto ecumênico</li>
            <li>Confraternizações</li>
            <li>Ensaios fotográficos</li>
          </ul>
          <p style="margin-top:15px;color:var(--text-light);">Todos os eventos extras são opcionais e organizados pela própria turma. A equipe de cerimonial da Colação poderá auxiliar com informações.</p>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="scroll-text"></i>
          </div>
          <h3>Roteiro da Cerimônia</h3>
          <ul>
            <li>Entrada dos formandos</li>
            <li>Composição da mesa</li>
            <li>Abertura oficial</li>
            <li>Hino Nacional</li>
            <li>Juramento</li>
            <li>Outorga de grau</li>
            <li>Cerimônia do capelo</li>
            <li>Discursos e homenagens</li>
            <li>Encerramento</li>
          </ul>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="mic"></i>
          </div>
          <h3>Participações Especiais</h3>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Orador(a)</h4>
          <ul>
            <li>1 representante para todas as turmas</li>
            <li>Texto de até 3.500 caracteres</li>
          </ul>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Mensagem aos Pais</h4>
          <ul>
            <li>1 representante para todas as turmas</li>
            <li>Texto de até 1.500 caracteres</li>
          </ul>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Juramentista</h4>
          <ul>
            <li>1 por curso</li>
            <li>Texto oficial da FAZU, sem alterações</li>
          </ul>
          <p style="margin-top:15px;color:var(--text-light);">Observação: A escolha dos homenageados e leitores deve ser feita após consulta a todos os formandos, preferencialmente por votação.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Envio dos textos</h4>
          <p style="margin-bottom:5px;">Até 15/07/2026</p>
          <p style="background:rgba(39,174,96,0.1);padding:10px;border-radius:8px;font-weight:700;color:var(--primary);">secretaria.presidencia@fazu.br</p>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="heart"></i>
          </div>
          <h3>Homenagens</h3>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Paraninfo(a)</h4>
          <p style="margin-bottom:15px;">Professor(a) escolhido(a) como padrinho/madrinha da turma, devido ao destaque no exercício da docência.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Patrono(a)</h4>
          <p style="margin-bottom:15px;">Professor(a) homenageado(a) pelas qualidades profissionais ou ideais da turma.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Nome de Turma</h4>
          <p style="margin-bottom:15px;">Professor(a) referência para os formandos, homenageado pelo exemplo profissional e/ou acadêmico.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Professor Homenageado</h4>
          <p style="margin-bottom:15px;">Professor(a) que se destacou por dedicação, carinho e proximidade com os alunos.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Funcionário Homenageado</h4>
          <p style="margin-bottom:15px;">1 por curso, reconhecido pela proximidade, afinidade e contribuições durante a graduação.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Envio da lista dos homenageados</h4>
          <p style="margin-bottom:5px;">Até 10/07/2026 para:</p>
          <p style="background:rgba(39,174,96,0.1);padding:10px;border-radius:8px;margin-bottom:5px;font-weight:700;color:var(--primary);">cinthia.caetano@fazu.br</p>
          <p style="margin-bottom:5px;">Com cópia para:</p>
          <p style="background:rgba(39,174,96,0.1);padding:10px;border-radius:8px;font-weight:700;color:var(--primary);">secretaria.presidencia@fazu.br</p>
          <p style="margin-top:15px;color:var(--text-light);">A Secretaria Acadêmica fará a entrega do convite/homenagem ao homenageado.</p>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="mail"></i>
          </div>
          <h3>Convites e Convidados</h3>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Convite cerimônia</h4>
          <ul>
            <li>Entrada livre</li>
            <li>Não é necessária apresentação de convites</li>
            <li>Espaço para aproximadamente 800 lugares</li>
            <li>43 formandos</li>
          </ul>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Convite de festa</h4>
          <p style="color:var(--text-light);">Responsabilidade da Comissão ou Representante de Turma.</p>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="camera"></i>
          </div>
          <h3>Foto e Filmagem</h3>
          <ul>
            <li>Cadastro prévio obrigatório</li>
            <li>Contratação dos serviços é responsabilidade da Comissão de Formatura ou Representante de Turma</li>
            <li>Permitido até 2 fotógrafos por empresa previamente cadastrados na FAZU</li>
            <li>Profissionais devem manter discrição e não interferir na cerimônia</li>
            <li>A FAZU registrará o evento para divulgação institucional</li>
            <li>Possibilidade de transmissão ao vivo pelo canal ABCZTV</li>
          </ul>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="alert-triangle"></i>
          </div>
          <h3>Orientações Importantes</h3>
          <ul>
            <li>É proibido o uso de buzinas, apitos ou cornetas dentro dos auditórios</li>
            <li>Convidados podem usar câmeras, filmadoras e celulares desde que permaneçam em seus lugares e não bloqueiem áreas de circulação</li>
          </ul>
        </div>
        
        <div class="documento-card">
          <div class="documento-icon">
            <i data-lucide="laptop"></i>
          </div>
          <h3>Diploma Digital</h3>
          <p style="margin-bottom:15px;">Emissão 100% digital</p>
          <p style="margin-bottom:15px;">O diploma será expedido conforme a Portaria MEC nº 1.095/2018, desde que toda a documentação exigida esteja entregue à Secretaria Acadêmica.</p>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">O diploma:</h4>
          <ul>
            <li>Será exclusivamente digital</li>
            <li>Terá link enviado por e-mail</li>
            <li>Poderá ser visualizado, baixado e validado</li>
          </ul>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Atenção</h4>
          <ul>
            <li>Mantenha seu e-mail atualizado na Secretaria Acadêmica</li>
            <li>Alunos estrangeiros devem providenciar tradução juramentada e convalidação dos estudos no Brasil</li>
          </ul>
          <h4 style="margin-top:20px;margin-bottom:10px;color:var(--primary);">Dúvidas</h4>
          <p style="background:rgba(39,174,96,0.1);padding:10px;border-radius:8px;font-weight:700;color:var(--primary);">atendimento.secretaria@fazu.br</p>
        </div>
      </div>
    </div>
  `;
}

function renderAdminVotosPage() {
  if (!isAdmin()) {
    return `
      <div class="page-content">
        <div class="alert-box" style="background:rgba(244, 67, 54, 0.1); border:1px solid rgba(244, 67, 54, 0.2);">
          <div class="alert-icon" style="background:rgba(244, 67, 54, 0.2); color:#ef5350;">
            <i data-lucide="lock"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#ef5350;">Acesso Negado</h3>
            <p style="color:#ffcdd2;">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Todos os Votos</h1>
        <p>Visualize todos os votos registrados</p>
      </div>
      
      <div class="documento-card">
        <h3 style="margin-bottom:20px;">Votos Registrados</h3>
        ${todosOsVotos.length > 0 ? `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:2px solid var(--border);">
                  <th style="text-align:left;padding:12px;color:var(--primary);">Data/Hora</th>
                  <th style="text-align:left;padding:12px;color:var(--primary);">Aluno</th>
                  <th style="text-align:left;padding:12px;color:var(--primary);">Categoria</th>
                  <th style="text-align:left;padding:12px;color:var(--primary);">Voto</th>
                </tr>
              </thead>
              <tbody>
                ${todosOsVotos.map(v => `
                  <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:12px;">${v.timestamp || '-'}</td>
                    <td style="padding:12px;">${v.aluno || '-'}</td>
                    <td style="padding:12px;">${v.categoria || '-'}</td>
                    <td style="padding:12px;font-weight:700;color:var(--primary);">${v.voto || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <p style="color:var(--text-light);text-align:center;padding:40px;">Nenhum voto registrado ainda.</p>
        `}
      </div>
    </div>
  `;
}

function renderAdminRelatoriosPage() {
  if (!isAdmin()) {
    return `
      <div class="page-content">
        <div class="alert-box" style="background:rgba(244, 67, 54, 0.1); border:1px solid rgba(244, 67, 54, 0.2);">
          <div class="alert-icon" style="background:rgba(244, 67, 54, 0.2); color:#ef5350;">
            <i data-lucide="lock"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#ef5350;">Acesso Negado</h3>
            <p style="color:#ffcdd2;">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  const totalAlunos = alunos.length || 9;
  const totalVotos = todosOsVotos.length;
  const votosPorCategoria = {};
  
  todosOsVotos.forEach(v => {
    if (!votosPorCategoria[v.categoria]) votosPorCategoria[v.categoria] = 0;
    votosPorCategoria[v.categoria]++;
  });
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Relatórios</h1>
        <p>Dados e estatísticas das votações</p>
      </div>
      
      <div class="cards-grid" style="margin-bottom:30px;">
        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="users"></i>
          </div>
          <div class="stat-info">
            <p class="stat-label">Total de Alunos</p>
            <p class="stat-value">${totalAlunos}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i data-lucide="vote"></i>
          </div>
          <div class="stat-info">
            <p class="stat-label">Total de Votos</p>
            <p class="stat-value">${totalVotos}</p>
          </div>
        </div>
      </div>
      
      <div class="documento-card">
        <h3 style="margin-bottom:20px;">Votos por Categoria</h3>
        ${Object.entries(votosPorCategoria).length > 0 ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;">
            ${Object.entries(votosPorCategoria).map(([cat, qtd]) => `
              <div style="padding:20px;background:rgba(39,174,96,0.08);border-radius:16px;border:1px solid rgba(39,174,96,0.2);">
                <p style="color:var(--text-light);font-size:13px;margin-bottom:5px;">${cat}</p>
                <p style="font-size:28px;font-weight:800;color:var(--primary);">${qtd} votos</p>
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="color:var(--text-light);text-align:center;padding:40px;">Nenhum dado para exibir.</p>
        `}
      </div>
    </div>
  `;
}

function renderAdminUsuariosPage() {
  if (!isAdmin()) {
    return `
      <div class="page-content">
        <div class="alert-box" style="background:rgba(244, 67, 54, 0.1); border:1px solid rgba(244, 67, 54, 0.2);">
          <div class="alert-icon" style="background:rgba(244, 67, 54, 0.2); color:#ef5350;">
            <i data-lucide="lock"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#ef5350;">Acesso Negado</h3>
            <p style="color:#ffcdd2;">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Gerenciar Usuários</h1>
        <p>Adicionar, editar e gerenciar alunos, professores e funcionários</p>
      </div>
      
      <div style="display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;">
        <button class="btn-primary" style="width:auto;${adminTab === 'alunos' ? 'background:linear-gradient(135deg,var(--primary-light),var(--primary));' : 'background:var(--bg-card);'}" onclick="setAdminTab('alunos')">
          <i data-lucide="user" style="width:18px;height:18px;"></i> Alunos
        </button>
        <button class="btn-primary" style="width:auto;${adminTab === 'professores' ? 'background:linear-gradient(135deg,var(--primary-light),var(--primary));' : 'background:var(--bg-card);'}" onclick="setAdminTab('professores')">
          <i data-lucide="graduation-cap" style="width:18px;height:18px;"></i> Professores
        </button>
        <button class="btn-primary" style="width:auto;${adminTab === 'funcionarios' ? 'background:linear-gradient(135deg,var(--primary-light),var(--primary));' : 'background:var(--bg-card);'}" onclick="setAdminTab('funcionarios')">
          <i data-lucide="users" style="width:18px;height:18px;"></i> Funcionários
        </button>
      </div>
      
      ${adminTab === 'alunos' ? renderAlunosTab() : ''}
      ${adminTab === 'professores' ? renderProfessoresTab() : ''}
      ${adminTab === 'funcionarios' ? renderFuncionariosTab() : ''}
    </div>
  `;
}

function renderAlunosTab() {
  return `
    <div class="documento-card" style="margin-bottom:20px;">
      <h3 style="margin-bottom:20px;">Adicionar Novo Aluno</h3>
      <div style="background:rgba(33, 150, 243, 0.1); border:1px solid rgba(33, 150, 243, 0.2); border-radius:12px; padding:15px; margin-bottom:20px;">
        <p style="color:#64b5f6; font-size:14px; margin:0;">
          <i data-lucide="shield-alert" style="width:16px; height:16px; display:inline-block; margin-right:8px;"></i>
          Senha segura precisa ter: pelo menos 6 caracteres, 1 letra maiúscula, 1 minúscula e 1 número.
        </p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px;">
        <div class="input-group" style="margin-bottom:0;">
          <label>Nome Completo</label>
          <input type="text" id="novo-aluno-nome" placeholder="Digite o nome completo" value="${novoAluno.nome}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Login</label>
          <input type="text" id="novo-aluno-login" placeholder="Digite o login" value="${novoAluno.login}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Senha</label>
          <input type="text" id="novo-aluno-senha" placeholder="Digite a senha segura" value="${novoAluno.senha}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Admin?</label>
          <select id="novo-aluno-admin" style="width:100%;padding:15px;border-radius:14px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);">
            <option value="false" ${!novoAluno.admin ? 'selected' : ''}>Não</option>
            <option value="true" ${novoAluno.admin ? 'selected' : ''}>Sim</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" onclick="adicionarAluno()" style="width:auto;">
        <i data-lucide="plus" style="width:18px;height:18px;"></i> Adicionar Aluno
      </button>
    </div>
    
    <div class="documento-card">
      <h3 style="margin-bottom:20px;">Alunos Cadastrados</h3>
      ${alunos.length > 0 ? `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:2px solid var(--border);">
                <th style="text-align:left;padding:12px;color:var(--primary);">Nome</th>
                <th style="text-align:left;padding:12px;color:var(--primary);">Login</th>
                <th style="text-align:left;padding:12px;color:var(--primary);">Admin</th>
                <th style="text-align:left;padding:12px;color:var(--primary);">Status</th>
                <th style="text-align:left;padding:12px;color:var(--primary);">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${alunos.map(a => `
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:12px;">${a.nome || '-'}</td>
                  <td style="padding:12px;">${a.login || '-'}</td>
                  <td style="padding:12px;">${a.admin ? 'Sim' : 'Não'}</td>
                  <td style="padding:12px;">${a.status || 'ATIVO'}</td>
                  <td style="padding:12px;">
                    <button style="background:rgba(39,174,96,0.1);border:1px solid rgba(39,174,96,0.2);color:var(--primary);padding:8px 12px;border-radius:8px;cursor:pointer;margin-right:8px;" onclick="resetarSenhaAluno(${a.id})">
                      <i data-lucide="key" style="width:16px;height:16px;"></i> Resetar Senha
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <p style="color:var(--text-light);text-align:center;padding:40px;">Nenhum aluno cadastrado.</p>
      `}
    </div>
  `;
}

function renderProfessoresTab() {
  return `
    <div class="documento-card" style="margin-bottom:20px;">
      <h3 style="margin-bottom:20px;">Adicionar Novo Professor</h3>
      <div class="input-group" style="margin-bottom:20px;">
        <label>Nome Completo</label>
        <input type="text" id="novo-professor-nome" placeholder="Digite o nome completo" value="${novoProfessor.nome}">
      </div>
      <button class="btn-primary" onclick="adicionarProfessor()" style="width:auto;">
        <i data-lucide="plus" style="width:18px;height:18px;"></i> Adicionar Professor
      </button>
    </div>
    
    <div class="documento-card">
      <h3 style="margin-bottom:20px;">Professores Cadastrados</h3>
      ${professores.length > 0 ? `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:2px solid var(--border);">
                <th style="text-align:left;padding:12px;color:var(--primary);">ID</th>
                <th style="text-align:left;padding:12px;color:var(--primary);">Nome</th>
              </tr>
            </thead>
            <tbody>
              ${professores.map(p => `
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:12px;">${p.id || '-'}</td>
                  <td style="padding:12px;">${p.nome || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <p style="color:var(--text-light);text-align:center;padding:40px;">Nenhum professor cadastrado.</p>
      `}
    </div>
  `;
}

function renderFuncionariosTab() {
  return `
    <div class="documento-card" style="margin-bottom:20px;">
      <h3 style="margin-bottom:20px;">Adicionar Novo Funcionário</h3>
      <div class="input-group" style="margin-bottom:20px;">
        <label>Nome Completo</label>
        <input type="text" id="novo-funcionario-nome" placeholder="Digite o nome completo" value="${novoFuncionario.nome}">
      </div>
      <button class="btn-primary" onclick="adicionarFuncionario()" style="width:auto;">
        <i data-lucide="plus" style="width:18px;height:18px;"></i> Adicionar Funcionário
      </button>
    </div>
    
    <div class="documento-card">
      <h3 style="margin-bottom:20px;">Funcionários Cadastrados</h3>
      ${funcionarios.length > 0 ? `
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:2px solid var(--border);">
                <th style="text-align:left;padding:12px;color:var(--primary);">ID</th>
                <th style="text-align:left;padding:12px;color:var(--primary);">Nome</th>
              </tr>
            </thead>
            <tbody>
              ${funcionarios.map(f => `
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:12px;">${f.id || '-'}</td>
                  <td style="padding:12px;">${f.nome || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <p style="color:var(--text-light);text-align:center;padding:40px;">Nenhum funcionário cadastrado.</p>
      `}
    </div>
  `;
}

function renderAdminConfigPage() {
  if (!isAdmin()) {
    return `
      <div class="page-content">
        <div class="alert-box" style="background:rgba(244, 67, 54, 0.1); border:1px solid rgba(244, 67, 54, 0.2);">
          <div class="alert-icon" style="background:rgba(244, 67, 54, 0.2); color:#ef5350;">
            <i data-lucide="lock"></i>
          </div>
          <div class="alert-content">
            <h3 style="color:#ef5350;">Acesso Negado</h3>
            <p style="color:#ffcdd2;">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="page-content">
      <div class="page-header">
        <h1>Configurações</h1>
        <p>Gerenciar todas as configurações do sistema</p>
      </div>
      
      <div class="documento-card" style="margin-bottom:20px;">
        <h3 style="margin-bottom:20px;">Controle de Votações</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
          <div style="padding:20px;background:rgba(39,174,96,0.08);border-radius:16px;border:1px solid rgba(39,174,96,0.2);">
            <h4 style="margin-bottom:15px;display:flex;align-items:center;gap:10px;"><i data-lucide="vote"></i> Votação Ativa</h4>
            <p style="color:var(--text-light);margin-bottom:15px;">Permite que os alunos votem</p>
            <div style="display:flex;gap:10px;">
              <button class="btn-primary" style="width:auto;${config.votacao_ativa === 'SIM' ? 'background:linear-gradient(135deg,var(--primary-light),var(--primary));' : 'background:var(--bg-card);'}" onclick="atualizarConfig('votacao_ativa', 'SIM')">
                <i data-lucide="check" style="width:18px;height:18px;"></i> Ativada
              </button>
              <button class="btn-secondary" style="width:auto;${config.votacao_ativa === 'NAO' ? 'background:rgba(244,67,54,0.2);border:1px solid rgba(244,67,54,0.3);color:#ef5350;' : ''}" onclick="atualizarConfig('votacao_ativa', 'NAO')">
                <i data-lucide="x" style="width:18px;height:18px;"></i> Desativada
              </button>
            </div>
          </div>
          
          <div style="padding:20px;background:rgba(39,174,96,0.08);border-radius:16px;border:1px solid rgba(39,174,96,0.2);">
            <h4 style="margin-bottom:15px;display:flex;align-items:center;gap:10px;"><i data-lucide="eye"></i> Resultado ao Vivo</h4>
            <p style="color:var(--text-light);margin-bottom:15px;">Mostra os resultados das votações em tempo real</p>
            <div style="display:flex;gap:10px;">
              <button class="btn-primary" style="width:auto;${config.resultado_ao_vivo === 'SIM' ? 'background:linear-gradient(135deg,var(--primary-light),var(--primary));' : 'background:var(--bg-card);'}" onclick="atualizarConfig('resultado_ao_vivo', 'SIM')">
                <i data-lucide="check" style="width:18px;height:18px;"></i> Ativado
              </button>
              <button class="btn-secondary" style="width:auto;${config.resultado_ao_vivo === 'NAO' ? 'background:rgba(244,67,54,0.2);border:1px solid rgba(244,67,54,0.3);color:#ef5350;' : ''}" onclick="atualizarConfig('resultado_ao_vivo', 'NAO')">
                <i data-lucide="x" style="width:18px;height:18px;"></i> Desativado
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="documento-card">
        <h3 style="margin-bottom:20px;">Outras Configurações</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;">
          <div style="padding:15px;background:rgba(39,174,96,0.08);border-radius:12px;border:1px solid rgba(39,174,96,0.2);">
            <p style="color:var(--text-light);font-size:13px;margin-bottom:5px;">Nome do Sistema</p>
            <p style="font-weight:700;color:var(--primary);">${config.nome_sistema || 'Agrocomputação FAZU 2026'}</p>
          </div>
          <div style="padding:15px;background:rgba(39,174,96,0.08);border-radius:12px;border:1px solid rgba(39,174,96,0.2);">
            <p style="color:var(--text-light);font-size:13px;margin-bottom:5px;">Tema</p>
            <p style="font-weight:700;color:var(--primary);">${config.tema || 'LIGHT'}</p>
          </div>
        </div>
        <p style="color:var(--text-light);margin-top:20px;">Para alterar as configurações de nome do sistema e tema, edite diretamente a tabela CONFIG no Supabase.</p>
      </div>
    </div>
  `;
}

function setAdminTab(tab) {
  adminTab = tab;
  renderApp();
}

async function adicionarAluno() {
  const nome = document.getElementById('novo-aluno-nome').value;
  const login = document.getElementById('novo-aluno-login').value;
  const senha = document.getElementById('novo-aluno-senha').value;
  const admin = document.getElementById('novo-aluno-admin').value === 'true';
  
  if (!nome || !login || !senha) {
    mostrarAlerta('Campos obrigatórios', 'Preencha todos os campos!', 'error');
    return;
  }
  
  const errosSenha = validarSenhaForte(senha);
  if (errosSenha.length > 0) {
    mostrarAlerta('Senha fraca', 'A senha precisa ter:\n• ' + errosSenha.join('\n• '), 'error');
    return;
  }
  
  const senhaHash = await hashPassword(senha);
  
  const sb = initSupabase();
  const { error } = await sb.from('alunos').insert({
    nome,
    login,
    senha: senhaHash,
    admin,
    status: 'ATIVO'
  });
  
  if (error) {
    mostrarAlerta('Erro', 'Erro ao adicionar aluno: ' + error.message, 'error');
    return;
  }
  
  mostrarAlerta('Sucesso!', 'Aluno adicionado com sucesso!', 'success');
  novoAluno = { nome: '', login: '', senha: '', admin: false };
  await carregarDados();
  renderApp();
}

async function adicionarProfessor() {
  const nome = document.getElementById('novo-professor-nome').value;
  
  if (!nome) {
    mostrarAlerta('Campo obrigatório', 'Preencha o nome!', 'error');
    return;
  }
  
  const sb = initSupabase();
  const { error } = await sb.from('professores').insert({ nome });
  
  if (error) {
    mostrarAlerta('Erro', 'Erro ao adicionar professor: ' + error.message, 'error');
    return;
  }
  
  mostrarAlerta('Sucesso!', 'Professor adicionado com sucesso!', 'success');
  novoProfessor = { nome: '' };
  await carregarDados();
  renderApp();
}

async function adicionarFuncionario() {
  const nome = document.getElementById('novo-funcionario-nome').value;
  
  if (!nome) {
    mostrarAlerta('Campo obrigatório', 'Preencha o nome!', 'error');
    return;
  }
  
  const sb = initSupabase();
  const { error } = await sb.from('funcionarios').insert({ nome });
  
  if (error) {
    mostrarAlerta('Erro', 'Erro ao adicionar funcionário: ' + error.message, 'error');
    return;
  }
  
  mostrarAlerta('Sucesso!', 'Funcionário adicionado com sucesso!', 'success');
  novoFuncionario = { nome: '' };
  await carregarDados();
  renderApp();
}

async function resetarSenhaAluno(id) {
  const novaSenha = prompt('Digite a nova senha para este aluno:');
  if (!novaSenha) return;
  
  const errosSenha = validarSenhaForte(novaSenha);
  if (errosSenha.length > 0) {
    mostrarAlerta('Senha fraca', 'A senha precisa ter:\n• ' + errosSenha.join('\n• '), 'error');
    return;
  }
  
  const senhaHash = await hashPassword(novaSenha);
  
  const sb = initSupabase();
  const { error } = await sb.from('alunos').update({ senha: senhaHash }).eq('id', id);
  
  if (error) {
    mostrarAlerta('Erro', 'Erro ao resetar senha: ' + error.message, 'error');
    return;
  }
  
  mostrarAlerta('Sucesso!', 'Senha resetada com sucesso!', 'success');
}

async function atualizarConfig(chave, valor) {
  const sb = initSupabase();
  
  const { data: existing } = await sb.from('config').select('*').eq('chave', chave);
  
  if (existing && existing.length > 0) {
    const { error } = await sb.from('config').update({ valor }).eq('chave', chave);
    if (error) {
      mostrarAlerta('Erro', 'Erro ao atualizar configuração: ' + error.message, 'error');
      return;
    }
  } else {
    const { error } = await sb.from('config').insert({ chave, valor });
    if (error) {
      mostrarAlerta('Erro', 'Erro ao criar configuração: ' + error.message, 'error');
      return;
    }
  }
  
  config[chave] = valor;
  mostrarAlerta('Sucesso!', 'Configuração atualizada!', 'success');
  renderApp();
}

function renderModal() {
  if (modalAberto === 'explicacao' && modalVotacaoAberto) {
    const categoria = modalVotacaoAberto;
    const explicacao = explicacoesCategorias[categoria] || '';
    const opcoes = getOpcoesPorCategoria(categoria);
    
    return `
      <div class="modal-overlay" onclick="fecharModal()">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2>${categoria}</h2>
            <button class="modal-close" onclick="fecharModal()">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-content">
            <div style="background:rgba(39,174,96,0.08);border:1px solid rgba(39,174,96,0.2);border-radius:14px;padding:18px;margin-bottom:20px;">
              <h4 style="color:var(--primary);margin-bottom:10px;display:flex;align-items:center;gap:8px;"><i data-lucide="info"></i> O que é?</h4>
              <p style="color:var(--text);font-size:14px;">${explicacao}</p>
            </div>
            
            ${opcoes.length > 0 ? `
              <div class="opcoes-list">
                ${opcoes.map(opcao => `
                  <div class="opcao-item ${votoSelecionado === opcao ? 'selected' : ''}" onclick="selecionarOpcao('${opcao}')">
                    <div class="opcao-radio"></div>
                    <span>${opcao}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="text-align:center;padding:40px;color:var(--text-light);">
                <i data-lucide="inbox" style="width:64px;height:64px;margin-bottom:16px;opacity:0.5;"></i>
                <p>Nenhuma opção disponível para esta categoria</p>
              </div>
            `}
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
            <button class="btn-primary" onclick="confirmarVoto('${categoria}')" ${!votoSelecionado || opcoes.length === 0 ? 'disabled' : ''}>
              Confirmar Voto
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  return '';
}

let votoSelecionado = null;

function abrirModalExplicacao(categoria) {
  modalAberto = 'explicacao';
  modalVotacaoAberto = categoria;
  votoSelecionado = votosDoAluno.find(v => v.categoria === categoria)?.voto || null;
  renderApp();
}

function fecharModal() {
  modalAberto = null;
  modalVotacaoAberto = null;
  votoSelecionado = null;
  renderApp();
}

function selecionarOpcao(opcao) {
  votoSelecionado = opcao;
  renderApp();
}

async function confirmarVoto(categoria) {
  if (!votoSelecionado) {
    mostrarAlerta('Selecione uma opção', 'Por favor, escolha uma opção para votar.', 'error');
    return;
  }
  
  const votoData = {
    aluno: currentUser.nome,
    categoria: categoria,
    voto: votoSelecionado,
    timestamp: new Date().toLocaleString('pt-BR')
  };
  
  const res = await upsertVoto(votoData);
  
  if (res.success) {
    mostrarAlerta('Sucesso!', 'Voto registrado com sucesso!', 'success');
    
    await carregarDados();
    
    fecharModal();
  } else {
    mostrarAlerta('Erro', res.message || 'Erro ao registrar voto.', 'error');
  }
}

function toggleSenha() {
  const senhaInput = document.getElementById('senha');
  const eyeIcon = document.getElementById('eye-icon');
  
  if (senhaInput.type === 'password') {
    senhaInput.type = 'text';
    eyeIcon.setAttribute('data-lucide', 'eye-off');
  } else {
    senhaInput.type = 'password';
    eyeIcon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

async function handleLogin() {
  const login = document.getElementById('login').value;
  const senha = document.getElementById('senha').value;
  const loginBtn = document.getElementById('login-btn');
  
  if (!login || !senha) {
    mostrarAlerta('Campos obrigatórios', 'Por favor, preencha login e senha.', 'error');
    return;
  }
  
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<div class="spinner"></div> Carregando...';
  
  const data = await fetchSupabase('alunos', { login: login });
  
  if (data.success && data.data && data.data.length > 0) {
    const user = data.data[0];
    
    const senhaHash = await hashPassword(senha);
    const senhaValida = (user.senha === senha) || (user.senha === senhaHash);
    
    if (senhaValida && user.status === 'ATIVO') {
      currentUser = {
        id: user.id,
        nome: user.nome,
        admin: user.admin
      };
      localStorage.setItem('formaturaUser', JSON.stringify(currentUser));
      currentPage = 'home';
      await carregarDados();
      renderApp();
    } else if (user.status !== 'ATIVO') {
      mostrarAlerta('Usuário inativo', 'Este usuário está inativo e não pode acessar o sistema.', 'error');
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Entrar';
    } else {
      mostrarAlerta('Credenciais inválidas', 'Login ou senha incorretos.', 'error');
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Entrar';
    }
  } else {
    mostrarAlerta('Credenciais inválidas', 'Login ou senha incorretos.', 'error');
    loginBtn.disabled = false;
    loginBtn.innerHTML = 'Entrar';
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('formaturaUser');
  currentPage = 'login';
  config = {
    votacao_ativa: 'SIM',
    resultado_ao_vivo: 'SIM',
    tema: 'LIGHT',
    nome_sistema: 'Agrocomputação FAZU 2026'
  };
  avisos = [];
  categorias = [];
  professores = [];
  funcionarios = [];
  alunos = [];
  cronograma = [];
  votosDoAluno = [];
  resultados = [];
  todosOsVotos = [];
  renderApp();
}

function navigateTo(page) {
  currentPage = page;
  renderApp();
  
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

document.addEventListener('DOMContentLoaded', initApp);
