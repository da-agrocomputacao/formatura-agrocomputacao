-- Criação das tabelas para o Sistema de Colação de Grau Agrocomputação FAZU 2026

-- Tabela de Alunos
CREATE TABLE alunos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    admin BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'ATIVO'
);

-- Tabela de Professores
CREATE TABLE professores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- Tabela de Funcionários
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- Tabela de Categorias de Votação
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ABERTO'
);

-- Tabela de Votações
CREATE TABLE votacoes (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aluno VARCHAR(255) NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    voto VARCHAR(255) NOT NULL,
    UNIQUE(aluno, categoria)
);

-- Tabela de Cronograma
CREATE TABLE cronograma (
    id SERIAL PRIMARY KEY,
    evento VARCHAR(255) NOT NULL,
    data VARCHAR(100),
    local VARCHAR(255)
);

-- Tabela de Avisos
CREATE TABLE avisos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT,
    data VARCHAR(100)
);

-- Tabela de Configurações
CREATE TABLE config (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL
);

-- Inserção de dados iniciais

-- Inserir alunos
INSERT INTO alunos (nome, login, senha, admin, status) VALUES
('BRUNO ALMEIDA MENEZES', 'bruno', 'bruno123', FALSE, 'ATIVO'),
('JEAN CARLOS DA SILVA SANTOS', 'jean', 'jean123', TRUE, 'ATIVO'),
('DAVID COSTA CAMPOS DE ALMEIDA', 'david', 'david123', TRUE, 'ATIVO'),
('LEONARDO D LUCA RAMOS MENDES', 'leonardo', 'leonardo123', FALSE, 'ATIVO'),
('LUIZ FERNANDO REIS SILVA', 'luiz', 'luiz123', FALSE, 'ATIVO'),
('FLÁVIO GUSTAVO DA SILVA', 'flavio', 'flavio123', FALSE, 'ATIVO'),
('MARIA LUÍSA RODRIGUES DE PAIVA', 'maria', 'maria123', FALSE, 'ATIVO'),
('JONATAS REZENDE ARTAGNAN', 'jonatas', 'jonatas123', FALSE, 'ATIVO'),
('DIOGO FERREIRA', 'diogo', 'diogo123', FALSE, 'ATIVO');

-- Inserir professores
INSERT INTO professores (nome) VALUES
('ALCIONE WAGNER DE SOUZA'),
('MARIANA ABRAHAO ASSUNCAO'),
('MARCELO AUGUSTO DA SILVA'),
('ROBERTO DUARTE DE CAMPOS'),
('JANDERSON FERREIRA CARDOSO'),
('DANIELLE LEAL MATARIM'),
('FELIPE GUSTAVO DE SOUZA'),
('MANUEL FERREIRA SILVA NETO'),
('GILL MAYERON DUARTE'),
('MATHEUS OLIVEIRA ALVES'),
('LUCIANO SOUZA PIMENTA'),
('GUILHERME SALGE ROLDÃO'),
('LUAN ALBERTO ODORIZZI DOS SANTOS'),
('ALEX SANDRO SOUZA DE OLIVEIRA');

-- Inserir categorias
INSERT INTO categorias (categoria, status) VALUES
('Paraninfo', 'ABERTO'),
('Patrono', 'ABERTO'),
('Nome da Turma', 'ABERTO'),
('Professor Homenageado', 'ABERTO'),
('Funcionário Homenageado', 'ABERTO'),
('Orador', 'ABERTO'),
('Juramentista', 'ABERTO'),
('Mensagem aos Pais', 'ABERTO');

-- Inserir cronograma oficial
INSERT INTO cronograma (evento, data, local) VALUES
('Entrega documentos pendentes', 'Até 30/06/2026', 'Secretaria Acadêmica'),
('Requerimento Colação de Grau', '01/07/2026 a 15/07/2026', 'atendimento.secretaria@fazu.br'),
('Lista homenageados por curso', 'Até 10/07/2026', 'cinthia.caetano@fazu.br'),
('Discurso Orador/Pais', 'Até 10/07/2026', 'secretaria.presidencia@fazu.br'),
('Convite aos homenageados', '15/07/2026', 'FAZU enviará'),
('Discurso Paraninfo', 'Até 20/07/2026', 'secretaria.presidencia@fazu.br'),
('Ensaio Colação de Grau', '29/07/2026 às 15h30', 'Centro de Eventos'),
('Solenidade Colação de Grau', '30/07/2026 às 19h00', 'Centro de Eventos da ABCZ');

-- Inserir configurações iniciais
INSERT INTO config (chave, valor) VALUES
('votacao_ativa', 'SIM'),
('resultado_ao_vivo', 'SIM'),
('tema', 'LIGHT'),
('nome_sistema', 'Agrocomputação FAZU 2026');

-- Habilitar Row Level Security (RLS) - opcional, mas recomendado
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir todas as operações para usuários autenticados - ajuste conforme necessidade)
CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON alunos FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON professores FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON funcionarios FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON categorias FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON votacoes FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON cronograma FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON avisos FOR ALL USING (true);

CREATE POLICY "Permitir acesso público a todas as tabelas" 
ON config FOR ALL USING (true);
