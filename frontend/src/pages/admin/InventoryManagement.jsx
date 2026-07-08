import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const defaultForm = { name: '', sku: '', description: '', quantity: '', threshold: '', supplier: '', cost: '' }

function InventoryManagement() {
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const loadInventory = () => {
    api.get('/inventory')
      .then((response) => setItems(response.data.inventory || []))
      .catch(() => setItems([]))
  }

  const loadTransactions = () => {
    api.get('/inventory/transactions')
      .then((response) => setTransactions(response.data.transactions || []))
      .catch(() => setTransactions([]))
  }

  useEffect(() => {
    loadInventory()
    loadTransactions()
    loadLowStock()
    const iv = setInterval(loadLowStock, 60000)
    return () => clearInterval(iv)
  }, [])

  const loadLowStock = () => {
    api.get('/inventory/low-stock')
      .then((response) => setLowStock(response.data.alerts || []))
      .catch(() => setLowStock([]))
  }

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        description: form.description,
        quantity: parseInt(form.quantity, 10) || 0,
        threshold: parseInt(form.threshold, 10) || 5,
        supplier: form.supplier,
        cost: parseFloat(form.cost) || 0,
      }
      let response
      if (editingId) {
        response = await api.put(`/inventory/${editingId}`, payload)
        setItems((current) => current.map((item) => (item.id === editingId ? response.data.item : item)))
        showToast('Inventory item updated successfully.')
        setMessage('Inventory item updated successfully.')
      } else {
        response = await api.post('/inventory', payload)
        setItems((current) => [...current, response.data.item])
        showToast('Inventory item added successfully.')
        setMessage('Inventory item added successfully.')
      }
      setForm(defaultForm)
      setEditingId(null)
      loadTransactions()
    } catch (error) {
      const errMsg = error.response?.data?.details || error.response?.data?.error || 'Unable to save inventory item.'
      showToast(errMsg, { variant: 'error' })
      setMessage(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name || '',
      sku: item.sku || '',
      description: item.description || '',
      quantity: item.quantity?.toString() || '',
      threshold: item.threshold?.toString() || '',
      supplier: item.supplier || '',
      cost: item.cost?.toString() || '',
    })
    setMessage(`Editing inventory item: ${item.name}`)
  }

  const handleDelete = async (itemId) => {
    setLoading(true)
    try {
      await api.delete(`/inventory/${itemId}`)
      setItems((current) => current.filter((item) => item.id !== itemId))
      showToast('Inventory item removed successfully.')
      setMessage('Inventory item removed successfully.')
      loadTransactions()
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Unable to remove inventory item.'
      showToast(errMsg, { variant: 'error' })
      setMessage(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/90 p-6 shadow-xl shadow-slate-200">
        <div>
          <h2 className="text-2xl font-semibold">Inventory Management</h2>
          <p className="mt-2 text-slate-600">Track stock, supplier details, and inventory adjustments.</p>
        </div>
      </section>

      {message && <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        {lowStock.length > 0 && (
          <div className="col-span-full rounded-3xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
            <strong>Low stock alerts:</strong> {lowStock.map((i) => i.name).join(', ')}
          </div>
        )}
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="mb-4 text-xl font-semibold">Inventory items</h3>
          {items.length ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-500">SKU: {item.sku || '—'}</p>
                      <p className="text-sm text-slate-500">Supplier: {item.supplier || 'Unknown'}</p>
                      <p className="text-sm text-slate-500">Cost: ${item.cost?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${item.quantity <= item.threshold ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</p>
                      <p className="text-sm text-slate-500">Threshold: {item.threshold}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEdit(item)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm hover:bg-slate-100">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No inventory items available.</p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h3 className="mb-4 text-xl font-semibold">{editingId ? 'Edit inventory item' : 'Add inventory item'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Item name" value={form.name} onChange={handleChange('name')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            <input type="text" placeholder="SKU" value={form.sku} onChange={handleChange('sku')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
            <input type="text" placeholder="Supplier" value={form.supplier} onChange={handleChange('supplier')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
            <textarea placeholder="Description" value={form.description} onChange={handleChange('description')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows="3" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange('quantity')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
              <input type="number" placeholder="Reorder threshold" value={form.threshold} onChange={handleChange('threshold')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            </div>
            <input type="number" step="0.01" placeholder="Cost" value={form.cost} onChange={handleChange('cost')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
-            <button className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-white hover:bg-violet-800">{editingId ? 'Update item' : 'Add item'}</button>
+            <button disabled={loading} className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-white hover:bg-violet-800 disabled:opacity-60">
+              {loading ? <LoadingSpinner className="mx-auto" /> : (editingId ? 'Update item' : 'Add item')}
+            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(defaultForm); setMessage('') }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 hover:bg-slate-100">
                Cancel edit
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <h3 className="mb-4 text-xl font-semibold">Recent inventory transactions</h3>
        {transactions.length ? (
          <ul className="space-y-3">
            {transactions.slice(0, 6).map((transaction) => (
              <li key={transaction.id} className="rounded-3xl border border-slate-200 p-4">
                <p className="font-semibold">Item #{transaction.item_id}</p>
                <p className="text-sm text-slate-500">Change: {transaction.quantity_change}</p>
                <p className="text-sm text-slate-500">Note: {transaction.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">No inventory transactions recorded yet.</p>
        )}
      </div>
    </div>
  )
}

export default InventoryManagement
