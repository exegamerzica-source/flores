"use client"

import { useState, useEffect } from "react"
import { Save, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"

export default function AdminPanel() {
  const [settings, setSettings] = useState({ whatsapp: "", storeName: "" })
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [token, setToken] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const loadData = async (authToken: string) => {
    setLoading(true)
    setErrorMsg("")
    try {
      // First ensure migration has run
      await fetch('/api/migrate').catch(() => {})

      const res = await fetch('/api/admin', { 
        headers: { 'Authorization': authToken },
        cache: 'no-store'
      })
      if (res.status === 401) {
        throw new Error("Senha incorreta. Tente novamente.")
      }
      const data = await res.json()
      if (data.error) {
        // If table error, trigger migration and retry once
        await fetch('/api/migrate')
        const retryRes = await fetch('/api/admin', { 
          headers: { 'Authorization': authToken },
          cache: 'no-store'
        })
        const retryData = await retryRes.json()
        setSettings(retryData.settings || { whatsapp: '5554981311242', storeName: 'Praça das Flowers' })
        setProducts(retryData.products || [])
      } else {
        setSettings(data.settings || { whatsapp: '5554981311242', storeName: 'Praça das Flowers' })
        setProducts(data.products || [])
      }
      setAuthenticated(true)
      setToken(authToken)
      localStorage.setItem('adminToken', authToken)
    } catch (e: any) {
      setErrorMsg(e.message || "Erro ao conectar")
      localStorage.removeItem('adminToken')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) {
      loadData(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const saveSettings = async () => {
    if (!settings.whatsapp) {
      alert("Por favor, digite o número do WhatsApp.")
      return
    }
    setSaving(true)
    setErrorMsg("")
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 4000)
      } else {
        setErrorMsg(data.error || "Erro ao salvar")
      }
    } catch(e: any) {
      setErrorMsg("Erro de rede ao salvar: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <RefreshCw className="animate-spin text-emerald-600" size={24} />
          <span className="text-slate-800 font-bold text-lg">Carregando painel administrativo...</span>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-2xl">
            🌸
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Painel Administrativo</h1>
          <p className="text-slate-600 text-sm mb-6">Digite sua senha de administrador para gerenciar a loja.</p>
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2 text-left">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <input 
            type="password" 
            id="tokenInput"
            placeholder="Senha de acesso" 
            className="w-full p-3.5 bg-slate-50 text-slate-900 font-semibold border-2 border-slate-300 rounded-xl mb-4 text-center focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none transition"
            onKeyDown={e => e.key === 'Enter' && loadData((e.target as HTMLInputElement).value)}
            autoFocus
          />
          <button 
            onClick={() => loadData((document.getElementById('tokenInput') as HTMLInputElement).value)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg transition transform active:scale-98 cursor-pointer"
          >
            Acessar Painel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
              <span>🌸</span> Painel Administrativo
            </h1>
            <p className="text-slate-600 text-sm font-medium mt-0.5">Praça das Flowers • Gestão em Tempo Real</p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              target="_blank" 
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition"
            >
              <span>Ver Loja ao Vivo</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </header>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-800 rounded-xl flex items-center gap-3 font-semibold">
            <AlertCircle size={20} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Global Settings */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">⚙️</span> Configurações Principais
            </h2>
            <p className="text-slate-600 text-sm font-medium mt-1">Altere o número do WhatsApp e o nome da loja. As alterações valem no mesmo segundo para todo o site.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2">
                Número do WhatsApp <span className="text-emerald-600 font-bold">(com DDD)</span>
              </label>
              <input 
                type="text" 
                value={settings?.whatsapp || ''}
                onChange={e => setSettings({...settings, whatsapp: e.target.value})}
                placeholder="Ex: 5554981311242"
                className="w-full p-3.5 bg-slate-50 text-slate-900 font-bold text-base border-2 border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none transition"
              />
              <p className="text-xs font-semibold text-slate-500 mt-2">
                💡 Dica: Você pode digitar no formato <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">5554981311242</code> ou <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">54981311242</code>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2">
                Nome da Loja
              </label>
              <input 
                type="text" 
                value={settings?.storeName || ''}
                onChange={e => setSettings({...settings, storeName: e.target.value})}
                placeholder="Praça das Flowers"
                className="w-full p-3.5 bg-slate-50 text-slate-900 font-bold text-base border-2 border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none transition"
              />
              <p className="text-xs font-semibold text-slate-500 mt-2">
                Nome visível nos cabeçalhos e títulos do site.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-4">
            <button 
              onClick={saveSettings} 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-6 py-3.5 rounded-xl font-black text-base flex items-center gap-2 shadow-lg transition transform active:scale-98 cursor-pointer"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{saving ? "Salvando alterações..." : "Salvar Configurações"}</span>
            </button>

            {saved && (
              <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm animate-bounce">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Configurações salvas! O site já está atualizado.</span>
              </div>
            )}
          </div>
        </section>

        {/* Products List */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-blue-600">📦</span> Catálogo de Produtos ({products.length})
              </h2>
              <p className="text-slate-600 text-sm font-medium mt-1">Produtos cadastrados e sincronizados com a loja online.</p>
            </div>
            <button 
              onClick={() => alert("Funcionalidade de adicionar novos produtos em expansão!")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus size={16} /> <span>Novo Produto</span>
            </button>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3.5 text-xs font-black text-slate-700 uppercase tracking-wider">ID</th>
                  <th className="p-3.5 text-xs font-black text-slate-700 uppercase tracking-wider">Foto</th>
                  <th className="p-3.5 text-xs font-black text-slate-700 uppercase tracking-wider">Título</th>
                  <th className="p-3.5 text-xs font-black text-slate-700 uppercase tracking-wider">Preço</th>
                  <th className="p-3.5 text-xs font-black text-slate-700 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                      Nenhum produto encontrado. Sincronizando com o catálogo...
                    </td>
                  </tr>
                ) : (
                  products.slice(0, 15).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 text-sm font-black text-slate-500">#{p.id}</td>
                      <td className="p-3.5">
                        <img 
                          src={p.raw_image || p.image} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs" 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/img/p1.jpg' }}
                        />
                      </td>
                      <td className="p-3.5 text-sm font-bold text-slate-900 max-w-xs truncate">{p.title}</td>
                      <td className="p-3.5 text-sm font-black text-emerald-700">R$ {p.price}</td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex gap-2">
                          <button 
                            onClick={() => alert(`Editar produto #${p.id} (${p.title})`)}
                            className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-white shadow-xs border border-slate-200 rounded-lg transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 size={15}/>
                          </button>
                          <button 
                            onClick={() => alert(`Excluir produto #${p.id}`)}
                            className="p-2 text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-white shadow-xs border border-slate-200 rounded-lg transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {products.length > 15 && (
              <div className="text-center p-3.5 text-xs font-bold text-slate-600 bg-slate-50 border-t border-slate-200">
                Exibindo os primeiros 15 produtos de um total de {products.length}.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
