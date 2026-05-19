import { createFileRoute } from '@tanstack/react-router';
import { PageTransition } from '@/components/page_transition';
import { requireAuthBeforeLoad } from '@/utils/route_guards';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Filter,
  Landmark,
  Lightbulb,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  Wallet,
  X,
} from 'lucide-react';

const KPI_CARDS = [
  {
    title: 'Transaksi Hari Ini',
    value: '6',
    meta: 'vs Kemarin: 5',
    delta: '+12%',
    positive: true,
    icon: BarChart3,
    iconTone: 'text-[#000f43] bg-[#000f43]/5',
  },
  {
    title: 'Jurnal Otomatis',
    value: '96',
    meta: 'vs Kemarin: 89',
    delta: '+8%',
    positive: true,
    icon: Sparkles,
    iconTone: 'text-[#00a472] bg-[#00a472]/10',
  },
  {
    title: 'Siap Posting',
    value: '24',
    meta: 'Menunggu konfirmasi',
    delta: 'Review',
    positive: true,
    icon: Upload,
    iconTone: 'text-[#d97706] bg-[#fef3c7]',
  },
  {
    title: 'Perlu Review',
    value: '7',
    meta: 'Tinggi risiko: 2',
    delta: '-2',
    positive: false,
    icon: CircleAlert,
    iconTone: 'text-[#ba1a1a] bg-[#ba1a1a]/10',
  },
  {
    title: 'AI Accuracy',
    value: '94.8%',
    meta: 'Target: 95%',
    delta: 'Stabil',
    positive: true,
    icon: Brain,
    iconTone: 'text-[#00a472] bg-[#6ffbbe]/25',
  },
  {
    title: 'Total Nilai',
    value: '2.45M',
    meta: 'Bulan Berjalan',
    delta: 'IDR',
    positive: true,
    icon: Wallet,
    iconTone: 'text-[#000f43] bg-[#dde1ff]',
  },
] as const;

const AI_ACTIVITIES = [
  {
    title: '1 invoice berhasil dianalisa',
    subtitle: '10:45 WIB • OCR Vision',
    icon: CheckCircle2,
    tone: 'text-[#00a472] bg-[#00a472]/10',
  },
  {
    title: '3 transaksi bank direkonsiliasi',
    subtitle: '09:12 WIB • Auto-Match',
    icon: Landmark,
    tone: 'text-[#000f43] bg-[#000f43]/5',
  },
  {
    title: 'Mapping COA disesuaikan',
    subtitle: '08:30 WIB • AI Suggestion',
    icon: Lightbulb,
    tone: 'text-[#d97706] bg-[#fef3c7]',
  },
  {
    title: 'Batch posting ERP selesai',
    subtitle: 'Kemarin • System Job',
    icon: Activity,
    tone: 'text-[#000f43] bg-[#dde1ff]',
  },
] as const;

const TRANSACTIONS = [
  {
    date: 'Hari ini, 14:20',
    source: 'INV',
    reference: '#INV-2024-049',
    vendor: 'AWS Cloud Services',
    amount: 'Rp 12.450.000',
    confidence: 98,
    status: 'Automated',
    statusTone: 'bg-[#00a472]/10 text-[#00a472]',
  },
  {
    date: 'Hari ini, 11:45',
    source: 'BANK',
    reference: 'TRF-BCA-9921',
    vendor: 'PT Maju Bersama',
    amount: 'Rp 85.000.000',
    confidence: 72,
    status: 'Needs Review',
    statusTone: 'bg-[#fffbeb] text-[#d97706]',
  },
  {
    date: 'Kemarin',
    source: 'EXP',
    reference: '#RF-9002',
    vendor: 'Budi (Reimburse)',
    amount: 'Rp 450.000',
    confidence: 100,
    status: 'Ready to Post',
    statusTone: 'bg-[#000f43]/5 text-[#000f43]',
  },
];

function DashboardPage() {
  return (
    <PageTransition>
      <div className="relative overflow-hidden bg-[#faf8ff] px-4 pb-12 pt-8 sm:px-8">
        <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-[#dde1ff] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-[#6ffbbe]/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1600px] space-y-8">
          <section className="rounded-2xl border border-[#c5c5d3]/30 bg-white/80 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#757682]">
                  <span>Finicore</span>
                  <span className="h-1 w-1 rounded-full bg-[#757682]" />
                  <span className="text-[#000f43]">Beranda</span>
                </div>
                <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#000f43] sm:text-3xl">
                  Dashboard Finance AI
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#00a472]/10 px-3 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#00a472]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00a472]">AI Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {KPI_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="rounded-xl border border-[#c5c5d3]/30 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className={`rounded-lg p-2 ${card.iconTone}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          card.positive ? 'text-[#00a472]' : 'text-[#ba1a1a]'
                        }`}
                      >
                        {card.delta}
                        {card.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757682]">{card.title}</p>
                    <p className="mt-1 text-2xl font-black text-[#000f43]">{card.value}</p>
                    <p className="mt-2 text-[10px] text-[#757682]">{card.meta}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#000f43] sm:text-base">
                <Activity className="h-4 w-4 text-[#00a472]" />
                Aktivitas AI Hari Ini
              </h3>
              <button className="text-[11px] font-bold text-[#000f43] hover:underline">Lihat Semua Log</button>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
              {AI_ACTIVITIES.map((activity) => {
                const Icon = activity.icon;
                return (
                  <article
                    key={activity.title}
                    className="flex items-center gap-3 rounded-xl border border-[#c5c5d3]/20 bg-white p-3 shadow-sm"
                  >
                    <span className={`rounded-lg p-2 ${activity.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#131b2e]">{activity.title}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#757682]">{activity.subtitle}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            <section className="xl:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-[#c5c5d3]/20 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#c5c5d3]/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-4 text-sm font-bold">
                    <button className="border-b-2 border-[#000f43] pb-1 text-[#000f43]">Semua</button>
                    <button className="pb-1 text-[#757682] hover:text-[#000f43]">Bisnis</button>
                    <button className="pb-1 text-[#757682] hover:text-[#000f43]">Bank</button>
                    <button className="pb-1 text-[#757682] hover:text-[#000f43]">Siap Posting</button>
                  </div>
                  <div className="flex gap-2">
                    <label className="relative">
                      <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#757682]" />
                      <input
                        type="text"
                        placeholder="Cari transaksi..."
                        className="h-9 w-48 rounded-lg border border-[#c5c5d3]/40 bg-[#f8f9ff] pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-[#000f43]/20"
                      />
                    </label>
                    <button className="rounded-lg border border-[#c5c5d3]/40 p-2 hover:bg-[#f2f3ff]">
                      <Filter className="h-4 w-4 text-[#757682]" />
                    </button>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="bg-[#f8f9ff]">
                      <tr>
                        {['Tanggal', 'Sumber', 'Referensi', 'Vendor/Pihak', 'Jumlah', 'Conf.', 'Status'].map((col, index) => (
                          <th
                            key={col}
                            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#757682] ${
                              index === 4 || index === 6 ? 'text-right' : ''
                            }`}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TRANSACTIONS.map((tx) => (
                        <tr key={tx.reference} className="border-t border-[#f2f3ff] transition-colors hover:bg-[#fafbff]">
                          <td className="px-4 py-3 text-xs text-[#757682]">{tx.date}</td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-[#000f43]/5 px-2 py-0.5 text-[10px] font-bold text-[#000f43]">
                              {tx.source}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-[#131b2e]">{tx.reference}</td>
                          <td className="px-4 py-3 text-sm text-[#444651]">{tx.vendor}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-[#131b2e]">{tx.amount}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[#edf0fb]">
                                <span
                                  className={`block h-full ${
                                    tx.confidence >= 90 ? 'bg-[#00a472]' : 'bg-[#f59e0b]'
                                  }`}
                                  style={{ width: `${tx.confidence}%` }}
                                />
                              </span>
                              <span className="text-[10px] font-bold text-[#57657a]">{tx.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tx.statusTone}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <aside className="space-y-6 xl:col-span-4">
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#000f43]">
                  <Lightbulb className="h-4 w-4 text-[#d97706]" />
                  Prioritas AI
                </h3>

                <div className="space-y-3">
                  <article className="rounded-xl border border-[#c5c5d3]/20 border-l-4 border-l-[#f59e0b] bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#d97706]">COA Belum Termapping</span>
                      <span className="rounded bg-[#f2f3ff] px-1.5 py-0.5 text-[10px] font-black text-[#57657a]">65% Conf.</span>
                    </div>
                    <p className="text-xs font-bold text-[#131b2e]">
                      Transaksi Grab For Business memerlukan mapping akun biaya operasional baru.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 rounded-lg bg-[#000f43] py-2 text-[10px] font-bold text-white hover:opacity-90">
                        Selesaikan Sekarang
                      </button>
                      <button className="rounded-lg border border-[#c5c5d3]/30 p-2">
                        <X className="h-4 w-4 text-[#757682]" />
                      </button>
                    </div>
                  </article>

                  <article className="rounded-xl border border-[#c5c5d3]/20 border-l-4 border-l-[#ba1a1a] bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase text-[#ba1a1a]">High-Risk Transaction</span>
                      <span className="rounded bg-[#f2f3ff] px-1.5 py-0.5 text-[10px] font-black text-[#57657a]">99% Alarm</span>
                    </div>
                    <p className="text-xs font-bold text-[#131b2e]">
                      Duplikasi invoice ditemukan pada vendor PT Sinar Mas dengan nilai Rp 50.000.000.
                    </p>
                    <button className="mt-4 w-full rounded-lg bg-[#ba1a1a] py-2 text-[10px] font-bold text-white hover:opacity-90">
                      Batalkan Transaksi
                    </button>
                  </article>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-bold text-[#000f43]">Analitik Finance</h3>
                <article className="space-y-6 rounded-2xl border border-[#c5c5d3]/20 bg-white p-5 shadow-sm">
                  <div>
                    <div className="mb-2 flex items-end justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#757682]">Cashflow Health</p>
                      <p className="text-xs font-bold text-[#000f43]">Inbound: 1.2M / Outbound: 0.8M</p>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-[#edf0fb]">
                      <span className="h-full w-[60%] bg-[#00a472]" />
                      <span className="h-full w-[40%] border-l-2 border-white bg-[#f59e0b]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#757682]">AI Auto-Rate</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xl font-black text-[#000f43]">82%</span>
                        <span className="text-[10px] font-bold text-[#00a472]">↑ 4%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#757682]">Posting Success</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xl font-black text-[#000f43]">99.2%</span>
                        <span className="text-[10px] font-bold text-[#00a472]">Stable</span>
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            </aside>
          </div>

          <section className="rounded-2xl border border-[#c5c5d3]/20 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#000f43] sm:text-base">
                <RefreshCw className="h-4 w-4" />
                Ringkasan Posting ERP (Accurate Online)
              </h3>
              <button className="inline-flex items-center gap-2 text-xs font-bold text-[#000f43] hover:underline">
                <RefreshCw className="h-4 w-4" />
                Re-Sync Database
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="flex items-center gap-3 rounded-xl border border-[#00a472]/15 bg-[#00a472]/5 p-4">
                <span className="rounded-xl bg-white p-3 text-[#00a472]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#57657a]">Posting Berhasil</p>
                  <p className="text-xl font-black text-[#000f43]">1,248</p>
                </div>
              </article>

              <article className="flex items-center gap-3 rounded-xl border border-[#ba1a1a]/15 bg-[#ba1a1a]/5 p-4">
                <span className="rounded-xl bg-white p-3 text-[#ba1a1a]">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#57657a]">Gagal Sinkron</p>
                  <p className="text-xl font-black text-[#ba1a1a]">3</p>
                </div>
              </article>

              <article className="rounded-xl border border-[#c5c5d3]/20 bg-[#f8f9ff] p-4 md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#57657a]">Progress Batch Posting</p>
                  <p className="text-[10px] font-bold text-[#000f43]">85% Complete</p>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#e2e7ff]">
                  <div className="h-full w-[85%] bg-[#000f43]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#57657a]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Sisa antrean: 37 transaksi
                  </span>
                  <button className="rounded-lg border border-[#c5c5d3]/40 bg-white px-3 py-1.5 text-[10px] font-bold text-[#57657a]">
                    Detail Queue
                  </button>
                </div>
              </article>
            </div>
          </section>
        </div>
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