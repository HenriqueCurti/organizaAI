<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DIRETIVA OBRIGATÓRIA: MOBILE-FIRST

> [!IMPORTANT]
> A grande maioria dos usuários acessa a plataforma através de smartphones (links compartilhados no WhatsApp).
> **Toda e qualquer interface, componente, modal, formulário ou ajuste DEVE ser desenvolvido seguindo a abordagem MOBILE-FIRST estrita.**

## Regras de Implementação Mobile-First:

1. **Responsividade Progressiva (Tailwind CSS)**:
   - A estilização base (sem prefixo) DEVE ser pensada para telas pequenas (360px a 430px).
   - Use modificadores progressivos (`sm:`, `md:`, `lg:`, `xl:`) exclusivamente para enriquecer a experiência em telas maiores, e **nunca** para consertar o mobile depois.
   - Em formulários e listas, empilhe por padrão (`flex-col`, `grid-cols-1`) e divida em colunas apenas com `sm:grid-cols-2` ou superior.

2. **Touch Targets e Ergonomia de Toque**:
   - Elementos clicáveis (botões, links, ícones de ação) devem ter área de toque confortável (mínimo de 40px a 44px de altura ou padding de toque adequado: `py-2.5` a `py-3`, `px-3` a `px-4`).
   - Ícones de ação isolados devem ter padding (ex: `p-2` ou `p-2.5 rounded-lg`), nunca use ícones soltos sem área de clique adequada.

3. **Tabelas e Dados Densos**:
   - Tabelas complexas não devem ser esmagadas em telas estreitas. Utilize containers com rolagem horizontal explícita (`overflow-x-auto`) ou, preferencialmente, cards individuais verticais no mobile (`block sm:hidden`) combinados com visualização em tabela para desktop (`hidden sm:table`).

4. **Modais e Diálogos**:
   - Todos os modais devem possuir `max-h-[90vh] overflow-y-auto` ou `max-h-[85vh]` e bom espaçamento interno para não transbordar a tela nem serem cortados quando o teclado virtual abrir.
   - O botão de fechar (`X`) deve estar sempre visível no canto superior e possuir área de clique generosa.

5. **Navegação e Abas**:
   - Menus e barras de abas devem suportar rolagem horizontal suave (`overflow-x-auto no-scrollbar` com itens `shrink-0`) para que nenhuma aba fique escondida ou truncada em celulares menores.
   - Fontes de inputs devem ser confortáveis (`text-sm` ou `text-base`), evitando que o navegador mobile execute zoom forçado indesejado.

