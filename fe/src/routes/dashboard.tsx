import { createFileRoute } from '@tanstack/react-router';
import { PageTransition } from '@/components/page_transition';
import { requireAuthBeforeLoad } from '@/utils/route_guards';
// NOTE: If using lucide-react only (no MUI), replace icons accordingly — see comments below.
// lucide-react equivalents used below as fallback

import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight as ChevronRightLucide,
  ClipboardEdit,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Plus,
  Search as SearchLucide,
  Settings as SettingsLucide,
  Star,
  TrendingUp as TrendingUpLucide,
  Wallet,
  Bell,
  FileEdit,
  HelpCircle,
  Lightbulb as LightbulbLucide,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const CASHFLOW_BARS = [
  { day: 'Sen', income: 45, expense: 30 },
  { day: 'Sel', income: 65, expense: 20 },
  { day: 'Rab', income: 55, expense: 45 },
  { day: 'Kam', income: 85, expense: 15 },
  { day: 'Jum', income: 70, expense: 50 },
  { day: 'Sab', income: 35, expense: 10 },
  { day: 'Min', income: 40, expense: 12 },
];

const ACTION_ALERTS = [
  {
    tag: 'Jurnal Operasional #829',
    title: 'Selisih Rekonsiliasi BCA',
    description: 'Perbedaan nominal antara mutasi bank dan pencatatan manual senilai Rp 2.4M...',
    urgent: true,
  },
  {
    tag: 'Vendor Payment',
    title: 'Pembayaran Cloud Server',
    description: 'Amazon Web Services - Invoice INV-00293 menunggu otorisasi...',
    urgent: false,
  },
];

const TRANSACTIONS = [
  {
    date: '12 Jun 2023',
    title: 'Biaya Langganan Adobe',
    invoice: 'INV-9283-CreativeCloud',
    category: 'Software & IT',
    status: 'Tersinkron',
    amount: '- Rp 850.000',
    positive: false,
  },
  {
    date: '11 Jun 2023',
    title: 'Pembayaran Proyek A',
    invoice: 'KLIEN-IND-023',
    category: 'Pendapatan',
    status: 'Tersinkron',
    amount: '+ Rp 45.000.000',
    positive: true,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TopBar() {
  return (
    <header className="flex justify-between items-center w-full px-4 mb-8">
      <div className="relative">
        <SearchLucide className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757682]" />
        <input
          type="text"
          placeholder="Cari data finansial..."
          className="pl-10 pr-4 py-2 bg-[#eaedff] border-none rounded-lg text-sm w-80 focus:ring-1 focus:ring-[#000f43]/20 transition-all placeholder:text-[#757682]/60 outline-none"
        />
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-[#57657a] hover:bg-[#e2e7ff] rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
        </button>
        <div className="flex items-center space-x-3 pl-4 border-l border-[#c5c5d3]/30">
          <div className="text-right">
            <p className="text-sm font-bold text-[#000f43]">Adrian Wijaya</p>
            <p className="text-[10px] text-[#57657a] font-medium uppercase tracking-tighter">Senior Architect</p>
          </div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGlrc94KKlMKhfQeP7N3kBIZabMyQhaNcM568DXiEC-unK1WIFwc01IaBYilZqsYLmkl5W6t0H8EuIU07Bs5mKjg-ZeT9spcQFCLs3vSn4FTdPS-igm4QhUFQIcV882a5w-_fO7Yq_KViWna4aQnNB-1yvDlf57ngEFEItYD-SmS9mg9_HMfASnNfR8Qi_0LMv_gheM8r8S4aJpsFi1Eib090HjLZD-pHXSx02dfrPsUVz-ACxc-YbjiQvShKTI9TdxcUxnKxLiFQ"
            alt="User profile photo"
            className="w-10 h-10 rounded-full object-cover ring-1 ring-[#002072]/20"
          />
        </div>
      </div>
    </header>
  );
}

function HeroStats() {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-[#000f43] tracking-tight">
            Ringkasan Aktivitas
          </h2>
          <p className="text-sm text-[#57657a] mt-1">Status kesehatan finansial Anda per hari ini.</p>
        </div>
        <div className="flex space-x-1 bg-[#eaedff] p-1 rounded-lg">
          {['Harian', 'Mingguan', 'Bulanan'].map((label, i) => (
            <button
              key={label}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${
                i === 1
                  ? 'bg-[#000f43] text-white shadow-sm font-bold'
                  : 'text-[#000f43] hover:bg-[#dae2fd]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Balance Card */}
        <div className="col-span-12 lg:col-span-4 bg-[#000f43] rounded-xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#002072] rounded-full opacity-20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                Saldo Terkonsolidasi
              </span>
              <Wallet className="w-5 h-5 text-white/40" />
            </div>
            <h3 className="font-headline text-3xl font-black text-white mb-2">Rp 4.829.000.000</h3>
            <div className="flex items-center space-x-2">
              <span className="flex items-center text-[#002113] bg-[#6ffbbe] px-2 py-0.5 rounded-full text-[10px] font-bold">
                <TrendingUpLucide className="w-3 h-3 mr-1" />
                +12.4%
              </span>
              <span className="text-white/50 text-[10px] font-medium uppercase tracking-tighter">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* Operational Expenses */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between border border-[#c5c5d3]/10">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-[#d5e3fc]/50 rounded-lg">
              <CreditCard className="w-5 h-5 text-[#000f43]" />
            </div>
            <span className="text-[10px] font-bold text-[#ba1a1a] uppercase tracking-tighter">
              Rp 124.5M Unpaid
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[#57657a] text-[10px] font-bold uppercase tracking-widest mb-1">
              Pengeluaran Operasional
            </p>
            <h4 className="font-headline text-2xl font-bold text-[#000f43]">Rp 1.240.500.000</h4>
          </div>
        </div>

        {/* Drafts & Unreconciled */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 grid grid-rows-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#c5c5d3]/10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-[#e2e7ff] rounded-lg text-[#000f43]">
                <ClipboardEdit className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#57657a] uppercase tracking-widest">Draft Jurnal</p>
                <h4 className="text-xl font-bold text-[#000f43]">
                  24 <span className="text-xs font-medium text-[#757682]">Entri</span>
                </h4>
              </div>
            </div>
            <ChevronRightLucide className="w-5 h-5 text-[#757682]/30" />
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#ba1a1a]/40 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-[#ba1a1a]/10 rounded-lg text-[#ba1a1a]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#57657a] uppercase tracking-widest">Belum Rekonsiliasi</p>
                <h4 className="text-xl font-bold text-[#000f43]">
                  12 <span className="text-xs font-medium text-[#757682]">Transaksi</span>
                </h4>
              </div>
            </div>
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a]/40 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CashFlowChart() {
  return (
    <div className="col-span-12 xl:col-span-8 bg-white rounded-xl p-8 shadow-sm border border-[#c5c5d3]/10">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-headline text-lg font-bold text-[#000f43]">Analisis Arus Kas</h3>
        <div className="flex items-center space-x-6">
          {[
            { color: 'bg-[#000f43]', label: 'Pemasukan' },
            { color: 'bg-[#002072]', label: 'Pengeluaran' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 ${color} rounded-full`} />
              <span className="text-[11px] font-semibold text-[#57657a] uppercase tracking-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-64 flex items-end justify-between space-x-2">
        {CASHFLOW_BARS.map(({ day, income, expense }) => (
          <div key={day} className="flex-1 flex flex-col items-center space-y-2 group">
            <div className="w-full flex flex-col items-center justify-end h-full space-y-1">
              <div
                className="w-1/3 bg-[#000f43] rounded-t-sm transition-all group-hover:scale-y-105"
                style={{ height: `${income}%` }}
              />
              <div
                className="w-1/3 bg-[#002072] rounded-t-sm transition-all group-hover:scale-y-105"
                style={{ height: `${expense}%` }}
              />
            </div>
            <span className="text-[10px] text-[#757682] font-bold uppercase">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-[#eaedff] rounded-lg border-l-4 border-[#000f43] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <LightbulbLucide className="w-5 h-5 text-[#000f43]" />
          <p className="text-[13px] text-[#444651] font-medium leading-relaxed">
            Prediksi Arus Kas minggu depan akan meningkat sebesar{' '}
            <span className="font-bold text-[#000f43]">15%</span> berdasarkan tren histori Anda.
          </p>
        </div>
        <button className="text-[11px] font-black text-[#000f43] uppercase tracking-widest hover:underline whitespace-nowrap">
          Detail
        </button>
      </div>
    </div>
  );
}

function ActionAlerts() {
  return (
    <div className="col-span-12 xl:col-span-4 flex flex-col space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-[#ba1a1a]/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#ba1a1a]/5 rounded-full -mr-8 -mt-8" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
            <h3 className="font-headline text-lg font-extrabold text-[#000f43]">Peringatan Tindakan</h3>
          </div>
          <span className="text-[10px] font-black text-white bg-[#ba1a1a] px-2 py-0.5 rounded uppercase">
            Urgent
          </span>
        </div>

        <div className="space-y-3 relative z-10">
          {ACTION_ALERTS.map((alert) => (
            <div
              key={alert.title}
              className={`group p-4 rounded-lg transition-all cursor-pointer ${
                alert.urgent
                  ? 'bg-[#f2f3ff] border border-transparent hover:border-[#ba1a1a]/20'
                  : 'bg-[#f2f3ff] hover:bg-[#e2e7ff]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-[#57657a] uppercase tracking-widest">
                  {alert.tag}
                </span>
                <span
                  className={`flex items-center text-[9px] font-black uppercase ${
                    alert.urgent ? 'text-[#ba1a1a]' : 'text-[#00a472]'
                  }`}
                >
                  {alert.urgent && (
                    <span className="w-1.5 h-1.5 bg-[#ba1a1a] rounded-full mr-1.5 animate-ping" />
                  )}
                  {!alert.urgent && (
                    <span className="w-1.5 h-1.5 bg-[#00a472] rounded-full mr-1.5" />
                  )}
                  {alert.urgent ? 'Butuh Tindakan' : 'Siap Review'}
                </span>
              </div>
              <p className="text-sm font-bold text-[#000f43] mb-1">{alert.title}</p>
              <p className="text-[11px] text-[#444651] leading-snug">{alert.description}</p>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 py-3 border border-[#c5c5d3]/30 text-[#000f43] text-[11px] font-black rounded-lg hover:bg-[#f2f3ff] transition-colors uppercase tracking-widest">
          Buka Semua Antrean
        </button>
      </div>

      {/* AI Quick Action */}
      <div className="bg-gradient-to-br from-[#000f43] to-[#002072] rounded-xl p-6 relative overflow-hidden border border-[#000f43]">
        <div className="relative z-10">
          <h4 className="text-white font-headline text-lg font-bold mb-1">Laporan Tahunan AI</h4>
          <p className="text-white/70 text-[11px] mb-4 leading-relaxed font-medium">
            Gunakan model AI terbaru untuk memprediksi pertumbuhan Q4 Anda secara akurat.
          </p>
          <button className="px-5 py-2 bg-[#6ffbbe] text-[#002113] font-black text-[10px] rounded-full uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
            Mulai Prediksi
          </button>
        </div>
      </div>
    </div>
  );
}

function RecentTransactions() {
  return (
    <section className="mt-10 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-lg font-bold text-[#000f43] uppercase tracking-tight">
          Transaksi Terkini
        </h3>
        <a href="#" className="text-[11px] font-black text-[#000f43] hover:underline uppercase tracking-widest">
          Ekspor Data .XLSX
        </a>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#c5c5d3]/10">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f2f3ff]/50">
              {['Tanggal', 'Deskripsi', 'Kategori', 'Status', 'Jumlah'].map((col, i) => (
                <th
                  key={col}
                  className={`px-6 py-4 text-[9px] font-black text-[#57657a] uppercase tracking-widest ${
                    i === 4 ? 'text-right' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c5c5d3]/10">
            {TRANSACTIONS.map((tx) => (
              <tr key={tx.invoice} className="hover:bg-[#f2f3ff] transition-colors group">
                <td className="px-6 py-5 text-[12px] font-semibold text-[#131b2e]">{tx.date}</td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#000f43]">{tx.title}</span>
                    <span className="text-[10px] text-[#757682] font-medium tracking-tight">{tx.invoice}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-[#e2e7ff] rounded text-[10px] font-bold text-[#000f43] uppercase tracking-tighter">
                    {tx.category}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="flex items-center text-[10px] font-bold text-[#00a472] uppercase tracking-tighter">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {tx.status}
                  </span>
                </td>
                <td
                  className={`px-6 py-5 text-sm font-black text-right ${
                    tx.positive ? 'text-[#00a472]' : 'text-[#000f43]'
                  }`}
                >
                  {tx.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-[#f2f3ff]/50 text-center border-t border-[#c5c5d3]/10">
          <button className="text-[11px] font-black text-[#000f43] uppercase tracking-widest hover:underline">
            Tampilkan 50 Transaksi Terakhir
          </button>
        </div>
      </div>
    </section>
  );
}

function DashboardPage() {
  return (
    <PageTransition>
      <div className="flex min-h-screen bg-[#faf8ff]">

        <main className="flex-1 p-8">
          <HeroStats />

          <div className="grid grid-cols-12 gap-8">
            <CashFlowChart />
            <ActionAlerts />
          </div>

          <RecentTransactions />
        </main>

        {/* FAB */}
        <button
          type="button"
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#000f43] text-white rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 transition-transform active:scale-95 z-50"
          aria-label="Catat Jurnal Baru"
        >
          <Plus className="w-7 h-7" />
          <span className="absolute right-16 bg-[#000f43] text-white px-4 py-2 rounded-lg text-[11px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg uppercase tracking-widest">
            Catat Jurnal Baru
          </span>
        </button>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    await requireAuthBeforeLoad();
  },
  component: DashboardPage,
});