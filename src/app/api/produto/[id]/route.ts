import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr
  return parseFloat(String(priceStr).replace('.', '').replace(',', '.')) || 0
}

function formatPrice(val: number): string {
  return val.toFixed(2).replace('.', ',')
}

function classifyCategory(item: any): string {
  const t = (item.title || '').toLowerCase()
  if (t.includes('coroa') || t.includes('guirlanda') || t.includes('condol')) return 'coroas'
  if (t.includes('cesta') || t.includes('caixa de caf') || t.includes('bandeja')) return 'cestas'
  if (t.includes('orqu')) return 'orquideas'
  if (t.includes('urso') || t.includes('pelúcia') || t.includes('pelucia') || t.includes('stitch') || t.includes('coração') || t.includes('unicórnio') || t.includes('touro') || t.includes('cachorro')) return 'pelucias'
  if (t.includes('buqu') || t.includes('buque')) return 'buques'
  if (t.includes('rosa') || t.includes('arranjo') || t.includes('gérbera') || t.includes('girassol')) return 'rosas'
  return 'outros'
}

function getProductImg(p: any): string {
  if (p.raw_image && p.raw_image.startsWith('http')) {
    return p.raw_image
  }
  if (!p.image) return '/img/isabelly/p1.webp'
  if (p.image.startsWith('http')) return p.image
  return p.image.startsWith('/') ? p.image : '/' + p.image
}

function getCategoryName(catKey: string): string {
  switch(catKey) {
    case 'buques': return 'Buquês de Flores'
    case 'rosas': return 'Arranjos Florais & Rosas'
    case 'cestas': return 'Cestas Especiais'
    case 'orquideas': return 'Orquídeas Selecionadas'
    case 'pelucias': return 'Pelúcias & Presentes'
    case 'coroas': return 'Coroas de Flores Solenes'
    default: return 'Flores & Presentes'
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(context.params)
  const idStr = resolvedParams?.id
  const prodId = parseInt(idStr, 10)

  // 1. Fetch settings from DB
  let settings = null
  let allProducts: any[] = []

  try {
    settings = await prisma.settings.findUnique({ where: { id: 'global' } })
    allProducts = await prisma.product.findMany({ orderBy: { id: 'asc' } })
  } catch (err) {
    console.error('Database connection error in /api/produto/[id]:', err)
  }

  // Fallback to local products.json if DB has no products
  if (!allProducts || allProducts.length === 0) {
    try {
      const jsonPath = path.join(process.cwd(), 'public', 'products.json')
      allProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    } catch(e) {
      console.error('Failed to load products.json fallback', e)
    }
  }

  // 2. Locate product
  let product = allProducts.find(p => p.id === prodId)

  if (!product && !isNaN(prodId)) {
    // Try finding by ID from DB directly
    try {
      product = await prisma.product.findUnique({ where: { id: prodId } })
    } catch(e) {}
  }

  // WhatsApp number normalization
  const rawPhone = settings?.whatsapp || '5554981311242'
  const cleanDigits = rawPhone.replace(/\D/g, '')
  let fullWith55 = cleanDigits
  let without55 = cleanDigits
  if (cleanDigits.startsWith('55') && cleanDigits.length >= 12) {
    fullWith55 = cleanDigits
    without55 = cleanDigits.slice(2)
  } else {
    fullWith55 = '55' + cleanDigits
    without55 = cleanDigits
  }

  // If still not found, return clean 404
  if (!product) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"><title>Produto Não Encontrado | Praça das Flowers</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center justify-center p-4">
        <div class="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
          <span class="text-4xl block mb-2">🌸</span>
          <h1 class="text-xl font-black text-slate-900 mb-2">Produto não encontrado</h1>
          <p class="text-xs text-slate-500 mb-6">O produto que você procura pode ter sido alterado ou esgotado.</p>
          <a href="/" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition inline-block">
            Voltar para a Página Inicial
          </a>
        </div>
      </body>
      </html>
    `, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  const priceNum = parsePrice(product.price)
  const oldPriceNum = priceNum * 1.25
  const parcelNum = priceNum / 3
  const catKey = classifyCategory(product)
  const catName = getCategoryName(catKey)
  const productImg = getProductImg(product)

  // Find 4 related products
  const sameCat = allProducts.filter(p => p.id !== product.id && classifyCategory(p) === catKey)
  const otherCat = allProducts.filter(p => p.id !== product.id && classifyCategory(p) !== catKey)
  const related = [...sameCat, ...otherCat].slice(0, 4)

  const productDescription = product.description && product.description.trim().length > 10 
    ? product.description 
    : `O ${product.title} é elaborado cuidadosamente por nossos floristas profissionais com flores frescas selecionadas do dia, acabamento nobre, laço em cetim e embalagem especial para presente. Acompanha cartão personalizado com sua dedicatória e entrega rápida com foto do arranjo enviada antes da saída do motoboy.`

  const relatedHtml = related.map(rel => {
    const rPrice = parsePrice(rel.price)
    const relImg = getProductImg(rel)
    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
        <a href="/produto/${rel.id}" class="aspect-square bg-slate-100 relative overflow-hidden block">
          <img src="${relImg}" alt="${rel.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.src='/img/isabelly/p1.webp'">
          <span class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 sm:px-2 rounded-md uppercase tracking-wider">
            ⏱️ 45 min
          </span>
        </a>
        <div class="p-2.5 sm:p-4 flex flex-col flex-1 justify-between">
          <div>
            <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
              ${getCategoryName(classifyCategory(rel))}
            </span>
            <a href="/produto/${rel.id}" class="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-rose-600 transition block">
              ${rel.title}
            </a>
            <div class="flex items-center gap-1 text-amber-500 text-[9px] sm:text-[10px] mt-1 mb-1.5">
              <span>★★★★★</span>
              <span class="text-slate-400 font-bold ml-0.5">4.9</span>
            </div>
          </div>
          <div class="mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-slate-100">
            <span class="text-sm sm:text-base font-black text-slate-900 block">
              R$ ${rel.price}
            </span>
            <span class="text-[9px] sm:text-[10px] text-slate-500 font-medium block">
              ou 3x de R$ ${formatPrice(rPrice / 3)}
            </span>
            <a href="/produto/${rel.id}" class="mt-2 w-full bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-bold text-[10px] sm:text-xs py-1.5 px-2 rounded-xl transition text-center border border-slate-200 block">
              Ver Produto ➔
            </a>
          </div>
        </div>
      </div>
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${product.title} | Praça das Flowers - Entrega em até 45 Minutos</title>
    <meta name="description" content="Compre ${product.title} por R$ ${product.price}. Entrega expressa em até 45 minutos para todo o Brasil. Flores frescas, cartão com dedicatória grátis e foto antes do envio.">
    
    <!-- OpenGraph / WhatsApp Preview -->
    <meta property="og:title" content="${product.title} - Praça das Flowers">
    <meta property="og:description" content="Flores frescas com entrega expressa em até 45 minutos no Brasil Inteiro. R$ ${product.price} - Compre online!">
    <meta property="og:image" content="${productImg}">
    <meta property="og:type" content="product">

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
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        html, body {
            overflow-x: hidden;
            max-width: 100vw;
            width: 100%;
        }
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
<body class="antialiased selection:bg-rose-100 selection:text-rose-900 min-h-screen flex flex-col pb-16 sm:pb-0">

    <!-- 1. TOP ANNOUNCEMENT BAR -->
    <div class="bg-slate-900 text-white text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 px-3 sm:px-4 text-center border-b border-slate-800">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <span class="flex items-center gap-1.5 mx-auto sm:mx-0">
                <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span>⚡ <strong>Entrega em até 45 min</strong> para todo o Brasil • Flores Frescas</span>
            </span>
            <div class="hidden sm:flex items-center gap-4 text-slate-300 text-xs">
                <span>🔒 Compra 100% Segura</span>
                <span>•</span>
                <a href="#contato" class="hover:text-white transition">Dúvidas? Fale no WhatsApp</a>
            </div>
        </div>
    </div>

    <!-- 2. HEADER PRINCIPAL -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
            <div class="flex items-center justify-between gap-2 sm:gap-4">
                
                <!-- Logo -->
                <a href="/" class="flex items-center gap-2 shrink-0 group">
                    <div class="w-9 h-9 md:w-11 md:h-11 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl border border-rose-100 shadow-2xs group-hover:scale-105 transition">
                        🌸
                    </div>
                    <div>
                        <span class="text-base sm:text-lg md:text-2xl font-black tracking-tight text-slate-900 block leading-tight">Praça das Flowers</span>
                        <span class="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-wider block">Floricultura & Presentes</span>
                    </div>
                </a>

                <!-- Navegação Rápida -->
                <div class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                    <a href="/#buques" class="hover:text-rose-600 transition">Buquês</a>
                    <a href="/#rosas" class="hover:text-rose-600 transition">Rosas</a>
                    <a href="/#cestas" class="hover:text-rose-600 transition">Cestas</a>
                    <a href="/#orquideas" class="hover:text-rose-600 transition">Orquídeas</a>
                    <a href="/#pelucias" class="hover:text-rose-600 transition">Pelúcias</a>
                    <a href="/#coroas" class="hover:text-rose-600 transition">Coroas de Flores</a>
                </div>

                <!-- Botão de Voltar ao Catálogo / WhatsApp -->
                <div class="flex items-center gap-1.5 sm:gap-2">
                    <a href="/" class="text-slate-600 hover:text-slate-900 font-bold text-xs sm:text-sm py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1">
                        <span>← Catálogo</span>
                    </a>
                    <button onclick="handleProductWpp()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-1.5 px-2.5 sm:py-2 sm:px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                        <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                        <span class="hidden sm:inline">WhatsApp</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- 3. BREADCRUMBS (MIGALHAS DE PÃO) -->
    <div class="bg-white border-b border-slate-100 py-2 text-xs text-slate-500">
        <div class="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
            <a href="/" class="hover:text-rose-600 transition font-medium">Início</a>
            <span>›</span>
            <a href="/#${catKey}" class="hover:text-rose-600 transition font-medium">${catName}</a>
            <span>›</span>
            <span class="text-slate-800 font-bold truncate max-w-xs sm:max-w-md">${product.title}</span>
        </div>
    </div>

    <!-- 4. CONTAINER PRINCIPAL DO PRODUTO (PADRÃO GIULIANA FLORES) -->
    <main class="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-10 flex-1 w-full pb-20 sm:pb-10">
        <div class="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-3.5 sm:p-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 lg:gap-12">
                
                <!-- COLUNA ESQUERDA: FOTO GRANDE DO PRODUTO -->
                <div class="flex flex-col gap-4">
                    <div class="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group">
                        <img 
                            src="${productImg}" 
                            alt="${product.title}" 
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onerror="this.onerror=null; this.src='/img/isabelly/p1.webp'"
                        >
                        <div class="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <span>⏱️</span> Entrega em até 45 min
                        </div>
                        <div class="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                            🌸 Flores Frescas do Dia
                        </div>
                    </div>

                    <!-- Mini Selos de Garantia abaixo da foto -->
                    <div class="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-slate-600 text-xs">
                        <div class="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span class="text-base sm:text-lg block mb-0.5">📸</span>
                            <span class="font-bold text-[10px] sm:text-[11px] text-slate-800 block">Foto Antes</span>
                            <span class="text-[9px] sm:text-[10px] text-slate-400">Pelo WhatsApp</span>
                        </div>
                        <div class="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span class="text-base sm:text-lg block mb-0.5">💌</span>
                            <span class="font-bold text-[10px] sm:text-[11px] text-slate-800 block">Cartão Incluso</span>
                            <span class="text-[9px] sm:text-[10px] text-slate-400">Com sua mensagem</span>
                        </div>
                        <div class="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span class="text-base sm:text-lg block mb-0.5">🔒</span>
                            <span class="font-bold text-[10px] sm:text-[11px] text-slate-800 block">Garantia Total</span>
                            <span class="text-[9px] sm:text-[10px] text-slate-400">Flores frescas</span>
                        </div>
                    </div>
                </div>

                <!-- COLUNA DIREITA: INFORMAÇÕES E DECISÃO DE COMPRA -->
                <div class="flex flex-col justify-between">
                    <div>
                        <!-- Categoria & Código -->
                        <div class="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                            <span class="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                ${catName}
                            </span>
                            <span class="text-[10px] sm:text-xs font-semibold text-slate-400">
                                Cód: #FL-${String(product.id).padStart(4, '0')}
                            </span>
                        </div>

                        <!-- Título do Produto -->
                        <h1 class="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-1.5 sm:mb-2">
                            ${product.title}
                        </h1>

                        <!-- Avaliações Google -->
                        <div class="flex items-center gap-1.5 mb-3 sm:mb-5">
                            <div class="flex text-amber-500 text-xs sm:text-sm">★★★★★</div>
                            <span class="text-[11px] sm:text-xs font-bold text-slate-800">4.9 / 5.0</span>
                            <span class="text-[10px] sm:text-xs text-slate-400">• 148 avaliações</span>
                        </div>

                        <!-- Caixa de Preço Principal -->
                        <div class="bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200 mb-3.5 sm:mb-5">
                            <span class="text-[11px] sm:text-xs text-slate-400 line-through font-bold block">
                                De R$ ${formatPrice(oldPriceNum)}
                            </span>
                            <div class="flex items-baseline gap-2 mt-0.5">
                                <span class="text-2xl sm:text-4xl font-black text-emerald-600">
                                    R$ ${product.price}
                                </span>
                                <span class="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                    25% OFF
                                </span>
                            </div>
                            <span class="text-[11px] sm:text-xs text-slate-600 font-semibold block mt-1">
                                ou em até <strong>3x de R$ ${formatPrice(parcelNum)}</strong> sem juros
                            </span>
                            <span class="text-[10px] sm:text-[11px] text-emerald-700 font-bold block mt-0.5">
                                ✓ Desconto especial no Pix
                            </span>
                        </div>

                        <!-- Urgência & Prazo de Entrega (A Regra dos 45 Minutos) -->
                        <div class="bg-emerald-50/90 border border-emerald-200 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-5">
                            <div class="flex items-start gap-2">
                                <span class="text-xl sm:text-2xl shrink-0">⚡</span>
                                <div>
                                    <h4 class="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide">
                                        Entrega Recorde em até 45 Minutos para Todo o Brasil
                                    </h4>
                                    <p class="text-[11px] sm:text-xs text-emerald-800 font-medium mt-0.5 leading-relaxed">
                                        Nossos ateliers e floristas parceiros na sua cidade realizam a montagem artesanal imediata com flores frescas e despacho prioritário.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Personalização: O Cartão Dedicatória Grátis -->
                        <div class="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 mb-5 sm:mb-6 space-y-2">
                            <div class="flex items-center justify-between">
                                <label for="card-msg" class="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                    <span>💌</span> Mensagem do Cartão com Dedicatória:
                                </label>
                                <span class="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    Grátis
                                </span>
                            </div>
                            <textarea 
                                id="card-msg" 
                                rows="3" 
                                placeholder="Escreva a mensagem especial que deseja no cartão (ou se preferir, pode enviar depois no WhatsApp)..."
                                class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition font-medium placeholder:text-slate-400 resize-none"
                            ></textarea>
                            <p class="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                                ✍️ Seu cartão é feito à mão com caligrafia caprichada e acompanha envelope lacrado.
                            </p>
                        </div>
                    </div>

                    <!-- Botões de Ação Principais -->
                    <div class="space-y-2 pt-1 sm:pt-2">
                        <!-- Botão Principal WhatsApp -->
                        <button onclick="handleProductWpp()" class="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-black py-3 sm:py-4 px-4 sm:px-6 rounded-2xl shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 text-sm sm:text-base transition transform active:scale-98 cursor-pointer">
                            <svg class="w-5 h-5 sm:w-6 sm:h-6 fill-current shrink-0" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                            <span>Comprar pelo WhatsApp (Entrega em 45 min)</span>
                        </button>

                        <!-- Botão Pagamento em Cartão Online -->
                        <button onclick="handlePayFlowClick()" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-sm cursor-pointer">
                            <span>💳 Pagar com Cartão de Crédito Online</span>
                        </button>
                    </div>

                    <p class="text-center text-[11px] text-slate-400 mt-3">
                        🔒 Compra 100% Protegida • Atendimento Imediato por Floristas Especialistas
                    </p>
                </div>

            </div>

            <!-- 5. FICHA TÉCNICA E DETALHES DO PRODUTO (TABS OU SEÇÃO) -->
            <div class="mt-12 pt-8 border-t border-slate-200">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    <div class="md:col-span-2">
                        <h3 class="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
                            <span>📋</span> Descrição Completa do Produto
                        </h3>
                        <p class="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-6 font-medium">
                            ${productDescription}
                        </p>

                        <h4 class="text-sm font-black text-slate-900 mb-2">Itens Inclusos no Pedido:</h4>
                        <ul class="space-y-1.5 text-xs text-slate-600 font-medium mb-6">
                            <li class="flex items-center gap-2">✓ <strong>${product.title}</strong> montado na hora com flores frescas</li>
                            <li class="flex items-center gap-2">✓ Embalagem decorativa especial para presente com laço refinado</li>
                            <li class="flex items-center gap-2">✓ Cartão com dedicatória impressa ou caligrafada à mão</li>
                            <li class="flex items-center gap-2">✓ Envio da foto do arranjo pronto pelo WhatsApp antes da saída</li>
                        </ul>
                    </div>

                    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 h-fit">
                        <h3 class="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5">
                            <span>🌿</span> Como Cuidar das Flores
                        </h3>
                        <ul class="space-y-2 text-xs text-slate-600 font-medium">
                            <li>• Mantenha as flores em local fresco e arejado.</li>
                            <li>• Evite exposição direta à luz solar forte e correntes de ar.</li>
                            <li>• Troque a água do vaso a cada 2 dias para manter as hastes hidratadas.</li>
                            <li>• Corte 1 cm das hastes em diagonal a cada troca de água.</li>
                        </ul>
                    </div>

                </div>
            </div>

        </div>

        <!-- 6. PRODUTOS RELACIONADOS (QUEM COMPROU ESTE TAMBÉM AMOU) -->
        <div class="mt-8 sm:mt-12">
            <div class="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h3 class="text-base sm:text-2xl font-black text-slate-900">Quem comprou este também amou</h3>
                    <p class="text-[11px] sm:text-sm font-medium text-slate-500">Sugestões especiais selecionadas para você</p>
                </div>
                <a href="/" class="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 transition">
                    Ver Todos ➔
                </a>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-5">
                ${relatedHtml}
            </div>
        </div>

    </main>

    <!-- 7. RODAPÉ INSTITUCIONAL -->
    <footer class="bg-slate-900 text-slate-300 text-xs pt-12 pb-8 border-t border-slate-800 mt-12" id="contato">
        <div class="max-w-7xl mx-auto px-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-2xl">🌸</span>
                        <span class="text-base font-black text-white">Praça das Flowers</span>
                    </div>
                    <p class="text-slate-400 text-xs leading-relaxed mb-3">
                        Floricultura e presentes com despacho rápido em até 45 minutos para todo o território nacional.
                    </p>
                    <p class="text-slate-400 text-xs font-semibold">
                        Atendimento: Seg a Dom das 07h às 22h
                    </p>
                </div>

                <div>
                    <h4 class="text-white font-bold text-sm mb-3">Categorias Populares</h4>
                    <ul class="space-y-2 text-slate-400">
                        <li><a href="/#buques" class="hover:text-white transition">Buquês de Rosas</a></li>
                        <li><a href="/#cestas" class="hover:text-white transition">Cestas de Café da Manhã</a></li>
                        <li><a href="/#orquideas" class="hover:text-white transition">Orquídeas Especiais</a></li>
                        <li><a href="/#pelucias" class="hover:text-white transition">Pelúcias & Presentes</a></li>
                        <li><a href="/#coroas" class="hover:text-white transition">Coroas de Flores Solenes</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white font-bold text-sm mb-3">Central de Atendimento</h4>
                    <ul class="space-y-2 text-slate-400">
                        <li>
                            <button onclick="handleProductWpp()" class="hover:text-white transition inline-flex items-center gap-1.5 text-left text-emerald-400 font-bold">
                                <span>💬 WhatsApp Oficial (Clique Aqui)</span>
                            </button>
                        </li>
                        <li><span>📍 Ateliers em todo o território nacional</span></li>
                        <li><span>⏱️ Despacho Imediato em até 45 min</span></li>
                        <li><span>📸 Foto do buquê enviada no WhatsApp</span></li>
                    </ul>
                </div>

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

            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px] text-center sm:text-left">
                <p>© 2026 Praça das Flowers Floricultura & Ateliers do Brasil. Todos os direitos reservados.</p>
                <p>Flores frescas selecionadas • Entrega expressa garantida</p>
            </div>
        </div>
    </footer>

    <!-- 8. BARRA FIXA MOBILE NO RODAPÉ (PADRÃO GIULIANA FLORES) -->
    <div class="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 px-3.5 flex items-center justify-between gap-3 shadow-lg">
        <div class="min-w-0">
            <span class="text-[9px] text-slate-400 font-semibold block leading-tight">Valor à vista:</span>
            <span class="text-base font-black text-emerald-600 block leading-tight truncate">R$ ${product.price}</span>
            <span class="text-[9px] text-slate-500 block truncate">3x R$ ${formatPrice(parcelNum)}</span>
        </div>
        <button onclick="handleProductWpp()" class="flex-1 max-w-[210px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer">
            <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
            <span>Pedir no WhatsApp</span>
        </button>
    </div>

    <!-- 9. BOTÃO WHATSAPP FLUTUANTE DESKTOP -->
    <a href="javascript:void(0)" onclick="handleProductWpp()" class="hidden sm:flex fixed bottom-5 right-5 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3.5 shadow-xl wpp-pulse transition transform hover:scale-105 items-center justify-center cursor-pointer" title="Falar no WhatsApp">
        <svg class="w-7 h-7 fill-current" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
    </a>

    <!-- SCRIPTS DE COMPRA -->
    <script>
        const WPP_PHONE = '${without55}';
        const productData = ${JSON.stringify({ id: product.id, title: product.title, price: product.price })};

        function handleProductWpp() {
            trackWppConversion('Product Page WhatsApp Buy');
            const cardMsg = (document.getElementById('card-msg')?.value || '').trim();
            let cardStr = cardMsg ? \`\\nMensagem para o Cartão: "\${cardMsg}"\` : '\\n(Dedicatória do cartão a combinar no WhatsApp)';

            const text = \`Olá! Gostei do produto: *\${productData.title}* (R$ \${productData.price}).\\nPreciso de entrega expressa em até 45 minutos no meu endereço.\${cardStr}\\n\\nVocês atendem minha cidade hoje?\`;
            const wppUrl = \`https://api.whatsapp.com/send?phone=+55\${WPP_PHONE}&text=\${encodeURIComponent(text)}\`;
            window.open(wppUrl, '_blank');
        }

        function handlePayFlowClick() {
            var title = productData.title || 'Pagamento Seguro';
            var rawPrice = productData.price || 99.90;
            var price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(',', '.')) : rawPrice;
            var url = 'https://linkmy-pay-vert.vercel.app/pay/dynamic?name=' + encodeURIComponent(title) + '&amount=' + encodeURIComponent(price);
            if (window.PayFlow && window.PayFlow.open) {
                window.PayFlow.open(url, title);
            } else {
                window.open(url, '_blank');
            }
        }
    </script>

    <!-- PayFlow Embed Runtime -->
    <script src="/payflow-embed.js"></script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
