import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { BarChart3, Download, Users, Building2, Smartphone, TrendingUp } from 'lucide-react'

interface Summary { total: number; used: number; failed: number; unassigned: number; expired: number; success_rate: number }
interface TrendItem { date: string; total: number; used: number; failed: number }
interface StaffReport { staff_name: string; mobile: string; total_otps: number; used: number; failed: number; success_rate: number }
interface ServiceReport { service: string; total_otps: number; used: number; failed: number; success_rate: number }
interface OperatorReport { operator_name: string; total_delivered: number; used: number; utilization_rate: number }

export function ReportsPage() {
  const [days, setDays] = useState(7)

  const { data: summary } = useQuery<Summary>({
    queryKey: ['report-summary', days],
    queryFn: async () => { const r = await api.get(`/api/admin/reports/summary?days=${days}`); return r.data },
  })

  const { data: trend } = useQuery<TrendItem[]>({
    queryKey: ['report-trend', days],
    queryFn: async () => { const r = await api.get(`/api/admin/reports/trend?days=${days}`); return r.data },
  })

  const { data: staffReport } = useQuery<StaffReport[]>({
    queryKey: ['report-staff'],
    queryFn: async () => { const r = await api.get('/api/admin/reports/staff-wise'); return r.data },
  })

  const { data: serviceReport } = useQuery<ServiceReport[]>({
    queryKey: ['report-service'],
    queryFn: async () => { const r = await api.get('/api/admin/reports/service-wise'); return r.data },
  })

  const { data: operatorReport } = useQuery<OperatorReport[]>({
    queryKey: ['report-operator'],
    queryFn: async () => { const r = await api.get('/api/admin/reports/operator-performance'); return r.data },
  })

  const handleExport = async () => {
    const r = await api.get('/api/admin/reports/export-csv', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([r.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'otp_report.csv'
    a.click()
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md font-display-md text-primary">Reports & Analytics</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">OTP activity reports and performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={handleExport} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-label-sm flex items-center gap-2 hover:bg-inverse-surface transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard title="Total OTPs" value={summary?.total ?? 0} icon={<BarChart3 className="w-5 h-5" />} />
        <SummaryCard title="Used" value={summary?.used ?? 0} icon={<TrendingUp className="w-5 h-5 text-tertiary-fixed-dim" />} color="green" />
        <SummaryCard title="Failed" value={summary?.failed ?? 0} icon={<BarChart3 className="w-5 h-5 text-error" />} color="error" />
        <SummaryCard title="Unassigned" value={summary?.unassigned ?? 0} icon={<BarChart3 className="w-5 h-5 text-secondary" />} color="secondary" />
        <SummaryCard title="Success Rate" value={`${summary?.success_rate ?? 0}%`} icon={<TrendingUp className="w-5 h-5 text-tertiary-fixed-dim" />} color="green" />
      </div>

      {/* Trend Chart */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-4">OTP Trend</h3>
        <div className="h-48 flex items-end gap-1 border-b border-l border-outline-variant p-2">
          {trend?.map((t, i) => {
            const maxVal = Math.max(...(trend.map(x => x.total) || [1]))
            const height = maxVal > 0 ? (t.total / maxVal * 100) : 0
            return (
              <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                <div
                  className="w-full bg-primary-container rounded-t-sm hover:opacity-80 transition-opacity"
                  style={{ height: `${height}%` }}
                  title={`${t.date}: ${t.total} total, ${t.used} used`}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between px-2 mt-2 text-[10px] text-on-surface-variant">
          {trend?.filter((_, i) => i % Math.ceil(trend.length / 7) === 0 || i === trend.length - 1).map((t, i) => (
            <span key={i}>{t.date.slice(5)}</span>
          ))}
        </div>
      </div>

      {/* Staff-wise Report */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
            <Users className="w-5 h-5" /> Staff-wise Report
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Staff Name</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold text-right">Total OTPs</th>
                <th className="px-4 py-3 font-semibold text-right">Used</th>
                <th className="px-4 py-3 font-semibold text-right">Failed</th>
                <th className="px-4 py-3 font-semibold text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {staffReport?.map((s, i) => (
                <tr key={i} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 font-medium text-primary">{s.staff_name}</td>
                  <td className="px-4 py-2">{s.mobile}</td>
                  <td className="px-4 py-2 text-right">{s.total_otps}</td>
                  <td className="px-4 py-2 text-right text-tertiary-fixed-dim">{s.used}</td>
                  <td className="px-4 py-2 text-right text-error">{s.failed}</td>
                  <td className="px-4 py-2 text-right font-bold">{s.success_rate}%</td>
                </tr>
              ))}
              {(!staffReport || staffReport.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service-wise Report */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Service-wise Report
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold text-right">Total OTPs</th>
                <th className="px-4 py-3 font-semibold text-right">Used</th>
                <th className="px-4 py-3 font-semibold text-right">Failed</th>
                <th className="px-4 py-3 font-semibold text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {serviceReport?.map((s, i) => (
                <tr key={i} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 font-medium text-primary">{s.service}</td>
                  <td className="px-4 py-2 text-right">{s.total_otps}</td>
                  <td className="px-4 py-2 text-right text-tertiary-fixed-dim">{s.used}</td>
                  <td className="px-4 py-2 text-right text-error">{s.failed}</td>
                  <td className="px-4 py-2 text-right font-bold">{s.success_rate}%</td>
                </tr>
              ))}
              {(!serviceReport || serviceReport.length === 0) && <tr><td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Performance */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
            <Smartphone className="w-5 h-5" /> Operator Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase border-b border-outline-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Operator</th>
                <th className="px-4 py-3 font-semibold text-right">Delivered</th>
                <th className="px-4 py-3 font-semibold text-right">Used</th>
                <th className="px-4 py-3 font-semibold text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-mono-data font-mono-data">
              {operatorReport?.map((o, i) => (
                <tr key={i} className="hover:bg-surface-container transition-colors h-12">
                  <td className="px-4 py-2 font-medium text-primary">{o.operator_name}</td>
                  <td className="px-4 py-2 text-right">{o.total_delivered}</td>
                  <td className="px-4 py-2 text-right text-tertiary-fixed-dim">{o.used}</td>
                  <td className="px-4 py-2 text-right font-bold">{o.utilization_rate}%</td>
                </tr>
              ))}
              {(!operatorReport || operatorReport.length === 0) && <tr><td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, icon, color = 'primary' }: {
  title: string; value: number | string; icon: React.ReactNode; color?: string
}) {
  const colorMap: Record<string, string> = { primary: 'text-primary', green: 'text-tertiary-fixed-dim', error: 'text-error', secondary: 'text-secondary' }
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">{title}</span>
        {icon}
      </div>
      <p className={`text-display-md font-display-md ${colorMap[color] || 'text-primary'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  )
}
