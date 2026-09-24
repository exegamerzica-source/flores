"use client"

import { useState, useEffect } from "react"
import { Save, Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react"

export default function AdminPanel() {
  const [settings, setSettings] = useState({ whatsapp: "", storeName: "" })
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin')
      .then(r => r.json())
      .then(data => {
        setSettings(data.settings)
        setProducts(data.products)
        setLoading(false)
      })
  }, [])

  const saveSettings = async () => {
    await fetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-10">Carregando painel...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <a href="/" target="_blank" className="text-blue-600 hover:underline">Ver Loja</a>
        </header>

        {/* Global Settings */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Configurações Globais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do WhatsApp (com DDD, ex: 5511999999999)</label>
              <input 
                type="text" 
                value={settings?.whatsapp || ''}
                onChange={e => setSettings({...settings, whatsapp: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Ao alterar aqui, todos os botões do site serão atualizados instantaneamente.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
              <input 
                type="text" 
                value={settings?.storeName || ''}
                onChange={e => setSettings({...settings, storeName: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3 items-center">
            <button onClick={saveSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Save size={18} /> Salvar Configurações
            </button>
            {saved && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16}/> Salvo com sucesso!</span>}
          </div>
        </section>

        {/* Products */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">Produtos ({products.length})</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
              <Plus size={16} /> Adicionar Produto
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Foto</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Título</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Preço</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.slice(0, 10).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-3 text-sm text-gray-500">#{p.id}</td>
                    <td className="p-3">
                      <img src={p.raw_image || p.image} alt="" className="w-10 h-10 object-cover rounded-md" />
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-900">{p.title}</td>
                    <td className="p-3 text-sm text-gray-600">R$ {p.price}</td>
                    <td className="p-3 flex gap-2">
                      <button className="p-1.5 text-gray-500 hover:text-blue-600 bg-white shadow-sm border rounded-md"><Edit2 size={14}/></button>
                      <button className="p-1.5 text-gray-500 hover:text-red-600 bg-white shadow-sm border rounded-md"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center p-4 text-sm text-gray-500 bg-gray-50 mt-2 rounded-lg">
              Mostrando os 10 primeiros produtos (sistema de paginação em breve)
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
