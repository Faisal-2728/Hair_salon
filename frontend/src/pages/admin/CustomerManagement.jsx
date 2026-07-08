import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    setLoading(true)
    api.get('/admin/customers')
      .then((response) => {
        const customersData = response.data.customers || []
        // Fetch appointment counts for each customer
        Promise.all(
          customersData.map((customer) =>
            api.get(`/appointments/manage?customer_id=${customer.id}`)
              .then((res) => ({
                ...customer,
                appointmentCount: res.data.appointments ? res.data.appointments.length : 0,
              }))
              .catch(() => ({ ...customer, appointmentCount: 0 }))
          )
        ).then(setCustomers)
      })
      .catch(() => {
        setCustomers([])
        showToast('Failed to load customers', { variant: 'error' })
      })
      .finally(() => setLoading(false))
  }, [])

  const deleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure? This will remove the customer account.')) return
    try {
      await api.delete(`/admin/customers/${customerId}`)
      setCustomers((current) => current.filter((c) => c.id !== customerId))
      showToast('Customer removed successfully', { variant: 'info' })
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to delete customer', { variant: 'error' })
    }
  }

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 shadow-xl text-white">
        <h2 className="text-3xl font-bold">Customer Management</h2>
        <p className="mt-2 text-blue-100">View and manage customer accounts and their appointment history.</p>
      </section>

      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">All Customers ({customers.length})</h3>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
            Total: {customers.length}
          </span>
        </div>

        {customers.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="space-y-4">
                  <div>
                    <p className="font-bold text-lg">{customer.full_name}</p>
                    <p className="text-sm text-slate-600 mt-1">{customer.email}</p>
                    {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{customer.appointmentCount}</p>
                      <p className="text-xs text-blue-600">Appointments</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-sm text-emerald-700">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-emerald-600">Joined</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        showToast('View customer details coming soon', { variant: 'info' })
                      }}
                      className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCustomer(customer.id)}
                      className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No customers yet.</p>
            <p className="text-slate-500 text-sm mt-2">Customers will appear here after they register.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerManagement
