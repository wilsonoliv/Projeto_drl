-- Base inicial para Supabase / PostgreSQL.
-- Revise e teste antes de usar com dados reais.
create extension if not exists pgcrypto;

create table public.modelos_campanha (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('sales','sales_positive','ranking')),
  versao integer not null default 1,
  configuracao jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.campanhas (
  id uuid primary key default gen_random_uuid(),
  modelo_id uuid not null references public.modelos_campanha(id),
  nome text not null,
  data_inicio date not null,
  data_fim date not null,
  regiao text,
  publico text not null check (publico in ('RCA','Operador','Gestor','Coordenador','Todos')),
  status text not null default 'rascunho' check (status in ('rascunho','ativa','encerrada','cancelada')),
  modelo_versao integer not null default 1,
  criado_em timestamptz not null default now(),
  check (data_fim >= data_inicio)
);

create table public.participantes (
  id uuid primary key default gen_random_uuid(),
  codigo_externo text not null unique,
  nome text not null,
  perfil text not null check (perfil in ('RCA','Operador','Gestor','Coordenador')),
  regiao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.importacoes (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id),
  nome_arquivo text not null,
  hash_arquivo text,
  tipo_origem text not null default 'snapshot' check (tipo_origem in ('snapshot','incremental')),
  status text not null default 'recebida' check (status in ('recebida','validada','processada','erro')),
  linhas_lidas integer not null default 0,
  linhas_invalidas integer not null default 0,
  importado_por uuid,
  criado_em timestamptz not null default now()
);

create table public.dados_campanha (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id),
  participante_id uuid not null references public.participantes(id),
  periodo date not null,
  venda numeric(14,2) not null default 0,
  meta_venda numeric(14,2) not null default 0,
  positivacao_pct numeric(7,3),
  outros_indicadores jsonb not null default '{}'::jsonb,
  importacao_id uuid references public.importacoes(id),
  atualizado_em timestamptz not null default now(),
  unique (campanha_id, participante_id, periodo)
);

create table public.resultados_campanha (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id),
  participante_id uuid not null references public.participantes(id),
  periodo date not null,
  atingimento_pct numeric(9,3),
  comissao numeric(14,2) not null default 0,
  bonus numeric(14,2) not null default 0,
  elegivel boolean not null default false,
  indicadores jsonb not null default '{}'::jsonb,
  versao_regra integer not null default 1,
  calculado_em timestamptz not null default now(),
  unique (campanha_id, participante_id, periodo)
);

create index idx_campanhas_periodo on public.campanhas(data_inicio, data_fim);
create index idx_dados_campanha_campanha_periodo on public.dados_campanha(campanha_id, periodo);
create index idx_resultados_campanha_campanha_periodo on public.resultados_campanha(campanha_id, periodo);

-- Segurança:
-- Antes de conectar o front-end, habilite RLS e crie políticas apropriadas.
-- Não exponha service_role key no navegador.
-- Este esquema não inclui ainda as políticas de produção, autenticação, auditoria ou armazenamento de arquivos.
