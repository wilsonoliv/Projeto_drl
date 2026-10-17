# Gestão de Campanhas — base inicial

## O que é
Protótipo de interface em HTML, CSS e JavaScript para explorar cadastro de modelos, campanhas, importação de Excel e cálculo básico de indicadores.

## Como abrir
1. Extraia o arquivo ZIP para uma pasta.
2. Abra `index.html` em um navegador moderno.
3. Navegue pelas seções e teste os dados de demonstração.
4. Para importar XLSX, XLS ou CSV, é necessária conexão com a internet para carregar a biblioteca SheetJS via CDN.

## Formato sugerido de planilha
Use a primeira linha como cabeçalho. Cabeçalhos reconhecidos incluem:
- `codigo` ou `RCA`
- `nome`
- `venda` ou `realizado`
- `meta`
- `positivacao` (percentual de 0 a 100)

Há um `exemplo_importacao.csv` para teste.

## O que esta versão faz
- Cadastra modelos: meta de vendas, vendas + positivação e ranking.
- Cadastra campanhas ligadas a um modelo.
- Calcula atingimento e comissão básica.
- Libera bônus do modelo vendas + positivação apenas se atingir a meta de vendas e a positivação mínima configurada.
- Importa arquivos e faz atualização por código de participante dentro da campanha.
- Mantém dados no `localStorage` do navegador.

## Limitações importantes
- Não é uma aplicação de produção.
- Os dados ficam no navegador atual, não em um banco compartilhado.
- Não tem login, permissões, trilha de auditoria, PDF ou envio de e-mails.
- A regra de comissão implementada é apenas ilustrativa. O protótipo considera comissão sobre venda quando a meta de vendas é atingida. Confirme o regulamento real antes de utilizar os cálculos.
- A importação atual atualiza por código de participante. Isso só é adequado quando cada arquivo representa uma fotografia consolidada da campanha e existe uma linha por participante. Não use assim para arquivos incrementais, múltiplos SKUs ou múltiplos períodos sem definir uma chave correta.
- Não use dados confidenciais da empresa neste protótipo.

## Próxima etapa: Supabase
1. Crie um projeto no Supabase.
2. Abra o SQL Editor e execute `schema.sql` em um projeto de teste.
3. Configure autenticação e políticas Row Level Security (RLS).
4. Crie uma camada de acesso ao banco e substitua `localStorage` pelas consultas ao Supabase.
5. Faça importação transacional no backend e registre versões das regras.
6. Teste os cálculos com relatórios reais já validados manualmente.

Nunca coloque a chave `service_role` no JavaScript do navegador. Para produção, use a chave pública/anon com RLS e funções de backend para operações privilegiadas.
