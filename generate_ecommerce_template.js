const fs = require('fs');

const products = JSON.parse(fs.readFileSync('public/products.json', 'utf8'));

const templateHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Praça das Flowers | Floricultura Online com Entrega em até 45 Minutos</title>
    
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18039204558"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'AW-18039204558');

      function trackWppConversion(label) {
        try {
          gtag('event', 'conversion', {
            'send_to': 'AW-18039204558',
            'event_category': 'WhatsApp',
            'event_label': label || 'Click WhatsApp'
          });
          gtag('event', 'generate_lead', {
            'event_category': 'WhatsApp',
            'event_label': label || 'Click WhatsApp'
          });
        } catch(e) {}
      }
    </script>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
        * { -webkit-tap-highlight-color: transparent; }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
        }
        @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .wpp-pulse { animation: pulse-green 2s infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    </style>
</head>
<body class="antialiased selection:bg-rose-100 selection:text-rose-900 min-h-screen flex flex-col">

    <!-- 1. TOP ANNOUNCEMENT BAR (PADRÃO DE E-COMMERCE CONFIÁVEL) -->
    <div class="bg-slate-900 text-white text-xs font-semibold py-2 px-4 text-center border-b border-slate-800">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <span class="flex items-center gap-1.5 mx-auto sm:mx-0">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>⚡ <strong>Entrega expressa em até 45 minutos</strong> para todo o Brasil • Flores frescas do dia</span>
            </span>
            <div class="hidden sm:flex items-center gap-4 text-slate-300 text-xs">
                <span>🔒 Compra 100% Segura</span>
                <span>•</span>
                <a href="#contato" class="hover:text-white transition">Dúvidas? Fale no WhatsApp</a>
            </div>
        </div>
    </div>

    <!-- 2. HEADER PRINCIPAL (PADRÃO GIULIANA FLORES / ISABELA FLORES) -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 py-3 sm:py-4">
            <div class="flex items-center justify-between gap-3 md:gap-8">
                
                <!-- Logo da Floricultura -->
                <a href="/" class="flex items-center gap-2 shrink-0 group">
                    <div class="w-10 h-10 md:w-11 md:h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl md:text-2xl border border-rose-100 shadow-2xs group-hover:scale-105 transition">
                        🌸
                    </div>
                    <div>
                        <span class="text-lg md:text-2xl font-black tracking-tight text-slate-900 block leading-tight">Praça das Flowers</span>
                        <span class="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider block">Floricultura & Presentes</span>
                    </div>
                </a>

                <!-- Barra de Busca Central -->
                <div class="flex-1 max-w-xl hidden md:block">
                    <div class="relative">
                        <input 
                            type="text" 
                            id="search-input-desktop" 
                            oninput="handleSearch(this.value)"
                            placeholder="O que você está procurando? (Ex: Rosas, Cestas, Orquídeas...)" 
                            class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition placeholder:text-slate-400 font-medium"
                        />
                        <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                <!-- Botão de Atendimento WhatsApp no Topo -->
                <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button onclick="handleGeneralWppClick('Olá! Gostaria de tirar uma dúvida sobre entrega de flores na minha cidade.')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-3.5 sm:px-4 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer">
                        <svg class="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                        <span class="hidden sm:inline">Atendimento</span>
                        <span class="sm:hidden">WhatsApp</span>
                    </button>
                </div>
            </div>

            <!-- Busca Mobile (Aparece somente em telas pequenas) -->
            <div class="mt-3 md:hidden">
                <div class="relative">
                    <input 
                        type="text" 
                        id="search-input-mobile" 
                        oninput="handleSearch(this.value)"
                        placeholder="Buscar flores, buquês, cestas..." 
                        class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-4 py-2 focus:bg-white focus:border-rose-500 outline-none transition placeholder:text-slate-400 font-medium"
                    />
                    <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>
        </div>

        <!-- 3. MENU DE CATEGORIAS HORIZONTAL (ESTILO E-COMMERCE TRADICIONAL) -->
        <nav class="border-t border-slate-100 bg-white">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap" id="category-tabs">
                    <button onclick="setCategory('all')" class="cat-tab px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold transition shadow-xs" data-cat="all">
                        Todos os Produtos
                    </button>
                    <button onclick="setCategory('buques')" class="cat-tab px-3.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition" data-cat="buques">
                        🌹 Buquês de Flores
                    </button>
                    <button onclick="setCategory('rosas')" class="cat-tab px-3.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition" data-cat="rosas">
                        💐 Arranjos & Rosas
                    </button>
                    <button onclick="setCategory('cestas')" class="cat-tab px-3.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition" data-cat="cestas">
                        🧺 Cestas Especiais
                    </button>
                    <button onclick="setCategory('orquideas')" class="cat-tab px-3.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition" data-cat="orquideas">
                        🪴 Orquídeas
                    </button>
                    <button onclick="setCategory('pelucias')" class="cat-tab px-3.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition" data-cat="pelucias">
                        🧸 Pelúcias & Chocolates
                    </button>
                    <button onclick="setCategory('coroas')" class="cat-tab px-3.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition" data-cat="coroas">
                        🕊️ Coroas de Flores
                    </button>
                </div>
            </div>
        </nav>
    </header>

    <!-- 4. BANNER PROMOCIONAL INSTITUCIONAL (LIMPO, TRANQUILO E FAMILIAR) -->
    <section class="bg-gradient-to-r from-rose-50 via-pink-50/60 to-amber-50/40 border-b border-rose-100/60 py-6 sm:py-10">
        <div class="max-w-7xl mx-auto px-4">
            <div class="max-w-2xl">
                <div class="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full mb-3">
                    <span>⏱️</span> Entrega Expressa em até 45 minutos no Brasil Inteiro
                </div>
                <h1 class="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2 sm:mb-3">
                    Surpreenda quem você ama com Flores Frescas e Montagem Artesanal.
                </h1>
                <p class="text-slate-600 text-xs sm:text-base font-medium leading-relaxed mb-4">
                    Flores selecionadas do dia, arranjos impecáveis, cartão personalizado grátis com a sua mensagem e foto do buquê pronto antes da entrega.
                </p>
                <div class="flex items-center gap-3">
                    <button onclick="scrollToProducts()" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-sm transition">
                        Ver Catálogo Completo
                    </button>
                    <button onclick="handleGeneralWppClick('Olá! Gostaria de consultar a disponibilidade de entrega em 45 minutos para o meu endereço.')" class="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5">
                        <span>Falar no WhatsApp</span>
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- 5. BARRA DE BENEFÍCIOS (PADRÃO E-COMMERCE CONFIÁVEL) -->
    <section class="bg-white border-b border-slate-200 py-4">
        <div class="max-w-7xl mx-auto px-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div class="flex items-center gap-3 p-2">
                    <span class="text-2xl">⚡</span>
                    <div>
                        <h4 class="text-xs sm:text-sm font-black text-slate-900 leading-tight">Entrega em até 45 min</h4>
                        <p class="text-[11px] text-slate-500 font-medium">Despacho para todo o Brasil</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 p-2">
                    <span class="text-2xl">📸</span>
                    <div>
                        <h4 class="text-xs sm:text-sm font-black text-slate-900 leading-tight">Foto Antes do Envio</h4>
                        <p class="text-[11px] text-slate-500 font-medium">Veja o arranjo pronto no WhatsApp</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 p-2">
                    <span class="text-2xl">💌</span>
                    <div>
                        <h4 class="text-xs sm:text-sm font-black text-slate-900 leading-tight">Cartão Grátis Incluso</h4>
                        <p class="text-[11px] text-slate-500 font-medium">Sua dedicatória personalizada</p>
                    </div>
                </div>
                <div class="flex items-center gap-3 p-2">
                    <span class="text-2xl">💳</span>
                    <div>
                        <h4 class="text-xs sm:text-sm font-black text-slate-900 leading-tight">Pagamento Seguro</h4>
                        <p class="text-[11px] text-slate-500 font-medium">Pix ou Cartão de Crédito</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 6. ÁREA PRINCIPAL DE PRODUTOS -->
    <main class="max-w-7xl mx-auto px-4 py-8 flex-1 w-full" id="catalogo">
        
        <!-- Cabeçalho da Lista de Produtos -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
            <div>
                <h2 id="section-title" class="text-xl sm:text-2xl font-black text-slate-900">Todos os Produtos</h2>
                <p id="products-count" class="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Carregando produtos...</p>
            </div>

            <!-- Ordenação -->
            <div class="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 self-end sm:self-auto">
                <label for="sort-select">Ordenar por:</label>
                <select id="sort-select" onchange="handleSort(this.value)" class="bg-white border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 font-semibold text-xs sm:text-sm outline-none focus:border-rose-500">
                    <option value="popular">Mais Populares</option>
                    <option value="price-asc">Menor Preço</option>
                    <option value="price-desc">Maior Preço</option>
                    <option value="name-asc">Nome (A - Z)</option>
                </select>
            </div>
        </div>

        <!-- Grid de Cards de Produtos -->
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" id="products-grid">
            <!-- Injetado dinamicamente via JavaScript -->
        </div>

        <!-- Mensagem de Nenhum Produto Encontrado -->
        <div id="no-products" class="hidden text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 my-6">
            <span class="text-4xl block mb-2">🔍</span>
            <h3 class="text-lg font-bold text-slate-800">Nenhum produto encontrado</h3>
            <p class="text-sm text-slate-500 mt-1 mb-4">Tente buscar por outro termo ou escolha outra categoria acima.</p>
            <button onclick="setCategory('all')" class="bg-rose-600 text-white font-bold text-xs py-2 px-4 rounded-xl">
                Ver Todos os Produtos
            </button>
        </div>
    </main>

    <!-- 7. SEÇÃO DE AVALIAÇÕES DE CLIENTES (PROVA SOCIAL PADRÃO) -->
    <section class="bg-white border-t border-slate-200 py-10">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center max-w-xl mx-auto mb-8">
                <span class="text-amber-500 text-sm">★★★★★</span>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">O que nossos clientes dizem</h3>
                <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">Avaliações reais de quem já comprou e presenteou conosco</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                    <div class="flex items-center gap-1 text-amber-500 text-xs mb-2">★★★★★</div>
                    <p class="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        "Fiz o pedido às pressas no dia do aniversário da minha mãe. Chegou em 40 minutos, com flores super frescas e o cartãozinho manuscrito com a mensagem que pedi. Nota 10!"
                    </p>
                    <div class="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-900">Camila Silveira</span>
                        <span class="text-slate-500">Google Review ✓</span>
                    </div>
                </div>

                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                    <div class="flex items-center gap-1 text-amber-500 text-xs mb-2">★★★★★</div>
                    <p class="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        "Me mandaram a foto do arranjo antes do motoboy sair para entrega. O atendimento no WhatsApp foi muito educado e rápido. Minha esposa amou a surpresa!"
                    </p>
                    <div class="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-900">Rodrigo Mendonça</span>
                        <span class="text-slate-500">Google Review ✓</span>
                    </div>
                </div>

                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                    <div class="flex items-center gap-1 text-amber-500 text-xs mb-2">★★★★★</div>
                    <p class="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        "Moro fora do país e mandei entregar flores para minha namorada no Brasil. Deu tudo muito certo, pagamento fácil e entrega super pontual!"
                    </p>
                    <div class="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-900">Lucas Fernandes</span>
                        <span class="text-slate-500">Google Review ✓</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 8. RODAPÉ INSTITUCIONAL (PADRÃO FLORICULTURA BRASILEIRA) -->
    <footer class="bg-slate-900 text-slate-300 text-xs pt-12 pb-8 border-t border-slate-800" id="contato">
        <div class="max-w-7xl mx-auto px-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
                
                <!-- Coluna 1: Sobre a Loja -->
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-2xl">🌸</span>
                        <span class="text-base font-black text-white">Praça das Flowers</span>
                    </div>
                    <p class="text-slate-400 text-xs leading-relaxed mb-3">
                        Sua floricultura online com rede de ateliers parceiros e entrega expressa em até 45 minutos em todas as capitais e cidades do Brasil.
                    </p>
                    <p class="text-slate-400 text-xs font-semibold">
                        Atendimento: Seg a Dom das 07h às 22h
                    </p>
                </div>

                <!-- Coluna 2: Categorias Rápidas -->
                <div>
                    <h4 class="text-white font-bold text-sm mb-3">Categorias Populares</h4>
                    <ul class="space-y-2 text-slate-400">
                        <li><a href="javascript:void(0)" onclick="setCategory('buques')" class="hover:text-white transition">Buquês de Rosas</a></li>
                        <li><a href="javascript:void(0)" onclick="setCategory('cestas')" class="hover:text-white transition">Cestas de Café da Manhã</a></li>
                        <li><a href="javascript:void(0)" onclick="setCategory('orquideas')" class="hover:text-white transition">Orquídeas Especiais</a></li>
                        <li><a href="javascript:void(0)" onclick="setCategory('pelucias')" class="hover:text-white transition">Pelúcias & Chocolates</a></li>
                        <li><a href="javascript:void(0)" onclick="setCategory('coroas')" class="hover:text-white transition">Coroas de Flores Solenes</a></li>
                    </ul>
                </div>

                <!-- Coluna 3: Atendimento e Suporte -->
                <div>
                    <h4 class="text-white font-bold text-sm mb-3">Central de Atendimento</h4>
                    <ul class="space-y-2 text-slate-400">
                        <li>
                            <button onclick="handleGeneralWppClick('Olá! Preciso de ajuda com um pedido no site.')" class="hover:text-white transition inline-flex items-center gap-1.5 text-left text-emerald-400 font-bold">
                                <span>💬 WhatsApp Oficial (Clique Aqui)</span>
                            </button>
                        </li>
                        <li><span>📍 Ateliers em todo o território nacional</span></li>
                        <li><span>⏱️ Despacho Imediato em até 45 min</span></li>
                        <li><span>📸 Foto do buquê enviada no WhatsApp</span></li>
                    </ul>
                </div>

                <!-- Coluna 4: Segurança & Pagamentos -->
                <div>
                    <h4 class="text-white font-bold text-sm mb-3">Pagamento & Segurança</h4>
                    <p class="text-slate-400 text-xs mb-3">
                        Aceitamos Pix com aprovação imediata e cartões de crédito em até 3x.
                    </p>
                    <div class="flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
                        <span class="bg-slate-800 px-2 py-1 rounded border border-slate-700">PIX</span>
                        <span class="bg-slate-800 px-2 py-1 rounded border border-slate-700">VISA</span>
                        <span class="bg-slate-800 px-2 py-1 rounded border border-slate-700">MASTERCARD</span>
                        <span class="bg-slate-800 px-2 py-1 rounded border border-slate-700">ELO</span>
                        <span class="bg-slate-800 px-2 py-1 rounded border border-slate-700">HIPERCARD</span>
                    </div>
                    <div class="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <span>🔒 Conexão Segura SSL 256 bits</span>
                    </div>
                </div>

            </div>

            <!-- Linha Final de Copyright -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px] text-center sm:text-left">
                <p>© 2026 Praça das Flowers Floricultura & Ateliers do Brasil. Todos os direitos reservados.</p>
                <p>Flores frescas selecionadas • Entrega expressa garantida</p>
            </div>
        </div>
    </footer>

    <!-- 9. MODAL DE DETALHES DO PRODUTO (PADRÃO E-COMMERCE LIMPO) -->
    <div id="product-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs hidden flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onclick="closeProductModal()">
        <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 relative animate-fadeIn" onclick="event.stopPropagation()">
            
            <!-- Botão Fechar -->
            <button onclick="closeProductModal()" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition cursor-pointer">
                ✕
            </button>

            <div class="grid grid-cols-1 sm:grid-cols-2">
                <!-- Foto do Produto -->
                <div class="aspect-square bg-slate-100 relative overflow-hidden">
                    <img id="modal-img" src="" alt="" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/img/isabelly/p1.webp'">
                    <span class="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        🌸 Flores Frescas do Dia
                    </span>
                </div>

                <!-- Conteúdo e Opções -->
                <div class="p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                        <span id="modal-cat" class="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1"></span>
                        <h3 id="modal-title" class="text-lg sm:text-xl font-black text-slate-900 leading-snug"></h3>
                        
                        <div class="mt-2 mb-4">
                            <div class="flex items-baseline gap-2">
                                <span id="modal-price" class="text-2xl font-black text-emerald-600"></span>
                                <span id="modal-old-price" class="text-xs text-slate-400 line-through font-bold"></span>
                            </div>
                            <span class="text-[11px] text-slate-500 font-semibold block">em até 3x sem juros ou desconto no Pix</span>
                        </div>

                        <!-- Mini Customizador: Cartão Dedicatória Grátis -->
                        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-bold text-slate-800 flex items-center gap-1">
                                    <span>💌</span> Cartão Dedicatória (Grátis):
                                </label>
                                <span class="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Incluso</span>
                            </div>
                            <textarea 
                                id="modal-card-text" 
                                rows="2" 
                                placeholder="Escreva a mensagem para o cartão (ou combine no WhatsApp)..." 
                                class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:border-rose-500 outline-none resize-none font-medium placeholder:text-slate-400"
                            ></textarea>
                        </div>

                        <!-- Opção de Entrega -->
                        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
                            <span class="text-xs font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                                <span>⏱️</span> Prazo de Entrega:
                            </span>
                            <div class="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>Entrega Imediata em até <strong>45 minutos</strong> na sua cidade</span>
                            </div>
                        </div>
                    </div>

                    <!-- Botões de Ação do Modal -->
                    <div class="space-y-2 pt-2 border-t border-slate-100">
                        <button onclick="handleModalWppSubmit()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer">
                            <svg class="w-5 h-5 fill-current shrink-0" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                            <span>Comprar pelo WhatsApp (Entrega em 45 min)</span>
                        </button>
                        
                        <button type="button" onclick="window.openPayFlowModalCurrent()" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs cursor-pointer">
                            <span>💳 Pagar com Cartão de Crédito Online</span>
                        </button>
                    </div>

                </div>
            </div>

        </div>
    </div>

    <!-- 10. BOTÃO WHATSAPP FLUTUANTE DISCRETO (PADRÃO CONFIÁVEL) -->
    <a href="javascript:void(0)" onclick="handleGeneralWppClick('Olá! Gostaria de fazer um pedido de flores para entrega hoje em até 45 minutos.')" class="fixed bottom-5 right-5 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3.5 shadow-xl wpp-pulse transition transform hover:scale-105 flex items-center justify-center cursor-pointer" title="Atendimento no WhatsApp">
        <svg class="w-7 h-7 fill-current" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
    </a>

    <!-- SCRIPT DE EXECUÇÃO DO E-COMMERCE -->
    <script>
        const WPP_PHONE = '54981311242';
        const allProducts = ${JSON.stringify(products)};

        // Classificação e Categorização Padrão
        function classifyCategory(item) {
            const t = (item.title || '').toLowerCase();
            if (t.includes('coroa') || t.includes('guirlanda') || t.includes('condol')) return 'coroas';
            if (t.includes('cesta') || t.includes('caixa de caf') || t.includes('bandeja')) return 'cestas';
            if (t.includes('orqu')) return 'orquideas';
            if (t.includes('urso') || t.includes('pelúcia') || t.includes('pelucia') || t.includes('stitch') || t.includes('coração') || t.includes('unicórnio') || t.includes('touro') || t.includes('cachorro')) return 'pelucias';
            if (t.includes('buqu') || t.includes('buque')) return 'buques';
            if (t.includes('rosa') || t.includes('arranjo') || t.includes('gérbera') || t.includes('girassol')) return 'rosas';
            return 'outros';
        }

        // Estado do Aplicativo
        let currentCategory = 'all';
        let currentSearch = '';
        let currentSort = 'popular';
        let currentModalProduct = null;

        const categoryTitles = {
            'all': 'Todos os Produtos',
            'buques': '🌹 Buquês de Flores',
            'rosas': '💐 Arranjos Florais & Rosas',
            'cestas': '🧺 Cestas de Café da Manhã & Presente',
            'orquideas': '🪴 Orquídeas Selecionadas',
            'pelucias': '🧸 Pelúcias & Chocolates',
            'coroas': '🕊️ Coroas de Flores Solenes'
        };

        function getCategoryLabel(catKey) {
            switch(catKey) {
                case 'buques': return 'Buquê Artesanal';
                case 'rosas': return 'Arranjo de Rosas';
                case 'cestas': return 'Cesta Especial';
                case 'orquideas': return 'Orquídea Nobre';
                case 'pelucias': return 'Pelúcia & Presente';
                case 'coroas': return 'Coroa de Homenagem';
                default: return 'Flores & Presentes';
            }
        }

        function parsePrice(priceStr) {
            if (typeof priceStr === 'number') return priceStr;
            return parseFloat(String(priceStr).replace('.', '').replace(',', '.')) || 0;
        }

        function formatPrice(val) {
            return val.toFixed(2).replace('.', ',');
        }

        function getProductImg(p) {
            if (p.raw_image && p.raw_image.startsWith('http')) return p.raw_image;
            if (!p.image) return '/img/isabelly/p1.webp';
            if (p.image.startsWith('http')) return p.image;
            return p.image.startsWith('/') ? p.image : '/' + p.image;
        }

        // Renderização dos Produtos
        function renderProducts() {
            const grid = document.getElementById('products-grid');
            const noProducts = document.getElementById('no-products');
            const countEl = document.getElementById('products-count');
            const titleEl = document.getElementById('section-title');

            let filtered = allProducts.filter(item => {
                const itemCat = classifyCategory(item);
                const matchesCat = (currentCategory === 'all') || (itemCat === currentCategory);
                
                const q = currentSearch.toLowerCase().trim();
                const matchesSearch = !q || (item.title && item.title.toLowerCase().includes(q));

                return matchesCat && matchesSearch;
            });

            // Ordenação
            if (currentSort === 'price-asc') {
                filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
            } else if (currentSort === 'price-desc') {
                filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
            } else if (currentSort === 'name-asc') {
                filtered.sort((a, b) => a.title.localeCompare(b.title));
            }

            titleEl.textContent = categoryTitles[currentCategory] || 'Produtos';
            countEl.textContent = \`Exibindo \${filtered.length} produto\${filtered.length === 1 ? '' : 's'}\`;

            if (filtered.length === 0) {
                grid.innerHTML = '';
                noProducts.classList.remove('hidden');
                return;
            }

            noProducts.classList.add('hidden');

            let html = '';
            filtered.forEach(p => {
                const priceNum = parsePrice(p.price);
                const oldPriceNum = priceNum * 1.25;
                const parcelNum = priceNum / 3;
                const catLabel = getCategoryLabel(classifyCategory(p));

                html += \`
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
                    
                    <!-- Imagem do Produto -->
                    <a href="/produto/\${p.id}" class="aspect-square bg-slate-100 relative overflow-hidden block">
                        <img 
                            src="\${getProductImg(p)}" 
                            alt="\${p.title}" 
                            loading="lazy" 
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onerror="this.onerror=null; this.src='/img/isabelly/p1.webp'"
                        >
                        <div class="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                            ⏱️ 45 min
                        </div>
                    </a>

                    <!-- Informações do Produto -->
                    <div class="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                        <div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                \${catLabel}
                            </span>
                            <a href="/produto/\${p.id}" class="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug hover:text-rose-600 transition block">
                                \${p.title}
                            </a>
                            <div class="flex items-center gap-1 text-amber-500 text-[10px] mt-1.5 mb-2">
                                <span>★★★★★</span>
                                <span class="text-slate-400 font-bold ml-1">4.9</span>
                            </div>
                        </div>

                        <div class="mt-2 pt-2 border-t border-slate-100">
                            <span class="text-[10px] text-slate-400 line-through font-semibold block">
                                R$ \${formatPrice(oldPriceNum)}
                            </span>
                            <div class="flex items-baseline gap-1">
                                <span class="text-base sm:text-lg font-black text-slate-900">
                                    R$ \${p.price}
                                </span>
                            </div>
                            <span class="text-[10px] text-slate-500 font-medium block mt-0.5">
                                ou 3x de R$ \${formatPrice(parcelNum)}
                            </span>

                            <!-- Botões de Ação -->
                            <div class="mt-3 flex flex-col gap-1.5">
                                <button onclick="buyOnWhatsApp(\${p.id})" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                                    <svg class="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                                    <span>Pedir no WhatsApp</span>
                                </button>
                                
                                <a href="/produto/\${p.id}" class="w-full bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-xs py-1.5 px-2 rounded-xl transition text-center border border-slate-200 block">
                                    Ver Detalhes do Produto ➔
                                </a>
                            </div>
                        </div>

                    </div>

                </div>\`;
            });

            grid.innerHTML = html;
        }

        // Troca de Categoria
        function setCategory(catKey) {
            currentCategory = catKey;
            
            // Atualiza botões da navbar
            document.querySelectorAll('.cat-tab').forEach(btn => {
                if (btn.getAttribute('data-cat') === catKey) {
                    btn.className = "cat-tab px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold transition shadow-xs";
                } else {
                    btn.className = "cat-tab px-3.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition";
                }
            });

            renderProducts();
        }

        // Filtro de Busca
        function handleSearch(val) {
            currentSearch = val;
            
            // Sincroniza inputs
            const d = document.getElementById('search-input-desktop');
            const m = document.getElementById('search-input-mobile');
            if (d && d.value !== val) d.value = val;
            if (m && m.value !== val) m.value = val;

            renderProducts();
        }

        // Ordenação
        function handleSort(sortVal) {
            currentSort = sortVal;
            renderProducts();
        }

        function scrollToProducts() {
            const el = document.getElementById('catalogo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }

        // Abrir Modal de Detalhes
        function openProductModal(productId) {
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            currentModalProduct = product;
            
            const priceNum = parsePrice(product.price);
            const oldPriceNum = priceNum * 1.25;

            document.getElementById('modal-img').src = getProductImg(product);
            document.getElementById('modal-cat').textContent = getCategoryLabel(classifyCategory(product));
            document.getElementById('modal-title').textContent = product.title;
            document.getElementById('modal-price').textContent = 'R$ ' + product.price;
            document.getElementById('modal-old-price').textContent = 'R$ ' + formatPrice(oldPriceNum);
            document.getElementById('modal-card-text').value = '';

            document.getElementById('product-modal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeProductModal() {
            document.getElementById('product-modal').classList.add('hidden');
            document.body.style.overflow = '';
            currentModalProduct = null;
        }

        // Finalizar no WhatsApp a partir do Modal
        function handleModalWppSubmit() {
            if (!currentModalProduct) return;
            trackWppConversion('Modal WhatsApp Buy');

            const cardMsg = document.getElementById('modal-card-text').value.trim();
            let cardStr = cardMsg ? \`\\nMensagem para o Cartão: "\${cardMsg}"\` : '\\n(Combinar dedicatória do cartão pelo WhatsApp)';

            const text = \`Olá! Gostei do *\${currentModalProduct.title}* (R$ \${currentModalProduct.price}).\\nPreciso de entrega expressa em até 45 minutos no meu endereço.\${cardStr}\\n\\nVocês atendem a minha cidade hoje?\`;
            const wppUrl = \`https://api.whatsapp.com/send?phone=+55\${WPP_PHONE}&text=\${encodeURIComponent(text)}\`;

            window.open(wppUrl, '_blank');
        }

        // Comprar direto no card
        function buyOnWhatsApp(productId) {
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            trackWppConversion('Card WhatsApp Buy');

            const text = \`Olá! Gostei do *\${product.title}* (R$ \${product.price}).\\nPreciso de entrega expressa em até 45 minutos no meu endereço com cartão dedicatória grátis.\\n\\nVocês atendem a minha cidade hoje?\`;
            const wppUrl = \`https://api.whatsapp.com/send?phone=+55\${WPP_PHONE}&text=\${encodeURIComponent(text)}\`;

            window.open(wppUrl, '_blank');
        }

        // Botão Geral de Atendimento
        function handleGeneralWppClick(customPrompt) {
            trackWppConversion('General WhatsApp CTA');
            const msg = customPrompt || 'Olá! Gostaria de fazer um pedido de flores para entrega hoje em até 45 minutos.';
            const wppUrl = \`https://api.whatsapp.com/send?phone=+55\${WPP_PHONE}&text=\${encodeURIComponent(msg)}\`;
            window.open(wppUrl, '_blank');
        }

        // Fechar modal no ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeProductModal();
        });

        // Inicialização
        document.addEventListener('DOMContentLoaded', () => {
            renderProducts();
        });
    </script>

    <!-- PayFlow Embed Runtime (Cartão de Crédito Online Seguro) -->
    <script src="payflow-embed.js"></script>
    <script>
        window.PAYFLOW_ORIGIN = "https://linkmy-pay-vert.vercel.app";
        window.openPayFlowCheckout = function(e, id) {
            if (e) {
                if (e.preventDefault) e.preventDefault();
                if (e.stopPropagation) e.stopPropagation();
            }
            var product = (typeof allProducts !== 'undefined') ? allProducts.find(function(p) { return p.id === id; }) : null;
            var title = product ? product.title : 'Pagamento Seguro';
            var rawPrice = product ? product.price : 99.90;
            var price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(',', '.')) : rawPrice;
            var url = 'https://linkmy-pay-vert.vercel.app/pay/dynamic?name=' + encodeURIComponent(title) + '&amount=' + encodeURIComponent(price);
            if (window.PayFlow && window.PayFlow.open) {
                window.PayFlow.open(url, title);
            } else {
                window.open(url, '_blank');
            }
        };

        window.openPayFlowModalCurrent = function() {
            if (!currentModalProduct) return;
            var title = currentModalProduct.title || 'Pagamento Seguro';
            var rawPrice = currentModalProduct.price || 99.90;
            var price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(',', '.')) : rawPrice;
            var url = 'https://linkmy-pay-vert.vercel.app/pay/dynamic?name=' + encodeURIComponent(title) + '&amount=' + encodeURIComponent(price);
            if (window.PayFlow && window.PayFlow.open) {
                window.PayFlow.open(url, title);
            } else {
                window.open(url, '_blank');
            }
        };
    </script>
</body>
</html>
`;

fs.writeFileSync('public/template.html', templateHtml, 'utf8');
console.log('Successfully written clean standard flower e-commerce template to public/template.html!');
