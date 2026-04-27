import { createFileRoute } from '@tanstack/react-router';
import { PageTransition } from '@/components/page_transition';
import { requireAuthBeforeLoad } from '@/utils/route_guards';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Filter,
  Link2,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Settings,
  Upload,
  X,
  Zap,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SUMMARY_STATS = [
  {
    label: 'Total Arus Masuk',
    value: 'Rp 2.8M',
    valueClass: 'text-[#00a472]',
    borderClass: 'border-[#00301e]',
  },
  {
    label: 'Arus Keluar',
    value: 'Rp 1.4M',
    valueClass: 'text-[#ba1a1a]',
    borderClass: 'border-[#ba1a1a]',
  },
  {
    label: 'Otomatisasi AI',
    value: '88',
    suffix: 'Item',
    valueClass: 'text-[#000f43]',
    borderClass: 'border-[#000f43]',
  },
];

type RowStatus = 'normal' | 'info' | 'error';

const LEDGER_ROWS: {
  date: string;
  time: string;
  desc: string;
  tag: string;
  tagClass: string;
  amount: string;
  debitCode: string;
  creditCode: string;
  debitLabel: string;
  creditLabel: string;
  debitError?: boolean;
  accountNote?: string;
  status: RowStatus;
}[] = [
  {
    date: '12 Agu 23',
    time: '14:20 WIB',
    desc: 'Tagihan Listrik PLN PT. Maju',
    tag: 'Utilitas',
    tagClass: 'bg-white border border-[#c5c5d3]/20 text-[#57657a]',
    amount: '12.450.000',
    debitCode: '6100',
    creditCode: '1110',
    debitLabel: 'Office Exp',
    creditLabel: 'BCA',
    status: 'normal',
  },
  {
    date: '11 Agu 23',
    time: '09:15 WIB',
    desc: 'Penerimaan Piutang A',
    tag: 'Piutang',
    tagClass: 'bg-[#f2f3ff] border border-[#c5c5d3]/10 text-[#57657a]',
    amount: '450.000.000',
    debitCode: '1110',
    creditCode: '1200',
    debitLabel: 'BCA',
    creditLabel: 'A/R',
    status: 'info',
  },
  {
    date: '10 Agu 23',
    time: '16:45 WIB',
    desc: 'Biaya Transport',
    tag: 'Konfirmasi',
    tagClass: 'bg-[#ffdad6] text-[#93000a]',
    amount: '345.000',
    debitCode: '----',
    creditCode: '1110',
    debitLabel: '',
    creditLabel: '',
    debitError: true,
    accountNote: 'Tentukan Akun',
    status: 'error',
  },
];

const CHAT_MESSAGES = [
  {
    role: 'ai' as const,
    text: 'Halo! Saya mendeteksi transaksi PLN PT. Maju sebagai Beban Operasional (98% confidence). Apakah ini benar?',
  },
  {
    role: 'user' as const,
    text: 'Ya, betul. Tolong klasifikasikan ke akun 6100.',
  },
  {
    role: 'ai' as const,
    text: 'Siap! Transaksi telah disiapkan untuk akun 6100 - Office Exp. Klik tombol ceklis di tabel untuk konfirmasi akhir.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStats() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {SUMMARY_STATS.map(({ label, value, suffix, valueClass, borderClass }) => (
        <div
          key={label}
          className={`bg-white p-6 rounded-2xl shadow-sm ring-1 ring-[#c5c5d3]/10 border-l-4 ${borderClass}`}
        >
          <p className="text-[#57657a] text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
          <p className={`text-3xl font-black ${valueClass}`}>
            {value}
            {suffix && <span className="text-xs font-medium text-[#57657a] ml-1">{suffix}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function LedgerTable() {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-[#c5c5d3]/10 overflow-hidden flex flex-col flex-1">
      {/* Table header */}
      <div className="p-6 border-b border-[#c5c5d3]/10 flex justify-between items-center">
        <h3 className="font-bold text-[#000f43] text-xl tracking-tight">Antrean Persetujuan Manual</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57657a]" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            className="pl-9 pr-4 py-2 bg-[#f2f3ff] border-none rounded-lg text-sm w-48 focus:ring-2 focus:ring-[#000f43]/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
          <thead>
            <tr className="bg-[#f2f3ff]/50">
              {['Tanggal', 'Deskripsi', 'Jumlah', 'Debit/Kredit', 'Aksi'].map((col, i) => (
                <th
                  key={col}
                  className={`px-6 py-4 text-[10px] font-black text-[#57657a] uppercase tracking-[0.1em] ${
                    i === 2 ? 'text-right' : i === 4 ? 'text-center' : ''
                  } ${i === 0 ? 'w-[15%]' : i === 1 ? 'w-[30%]' : i === 2 ? 'w-[20%]' : i === 3 ? 'w-[20%]' : 'w-[15%]'}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c5c5d3]/10">
            {LEDGER_ROWS.map((row) => (
              <tr
                key={row.date + row.desc}
                className={`group transition-colors ${
                  row.status === 'normal'
                    ? 'bg-[#000f43]/5 hover:bg-[#000f43]/10'
                    : row.status === 'error'
                      ? 'hover:bg-[#ba1a1a]/5'
                      : 'hover:bg-[#eaedff]'
                }`}
              >
                <td className="px-6 py-5">
                  <p className="font-bold text-[#000f43] text-sm">{row.date}</p>
                  <p className="text-[9px] text-[#57657a] font-medium uppercase">{row.time}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="font-extrabold text-[#000f43] text-sm truncate" title={row.desc}>
                    {row.desc}
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${row.tagClass}`}
                  >
                    {row.tag}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <p className="font-black text-[#000f43] text-sm">{row.amount}</p>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-bold ${row.debitError ? 'text-[#ba1a1a]' : 'text-[#000f43]'}`}>
                      {row.debitCode}
                    </p>
                    <ArrowRight className="w-3 h-3 text-[#57657a]" />
                    <p className="text-xs font-bold text-[#000f43]">{row.creditCode}</p>
                  </div>
                  <p className={`text-[9px] truncate ${row.debitError ? 'text-[#ba1a1a] font-semibold' : 'text-[#57657a]'}`}>
                    {row.accountNote ?? `${row.debitLabel} → ${row.creditLabel}`}
                  </p>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center gap-1.5">
                    {row.status === 'error' ? (
                      <>
                        <button className="w-8 h-8 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-center justify-center hover:scale-110 transition-transform">
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-[#000f43] text-white flex items-center justify-center hover:scale-110 transition-transform">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="w-8 h-8 rounded-lg bg-[#6ffbbe] text-[#002113] flex items-center justify-center hover:scale-110 transition-transform">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-[#eaedff] text-[#57657a] flex items-center justify-center hover:bg-[#c5c5d3] transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-[#f2f3ff]/30 border-t border-[#c5c5d3]/10 flex justify-between items-center mt-auto">
        <p className="text-xs text-[#57657a] font-semibold">Menampilkan 3 dari 12 entri tertunda</p>
        <div className="flex gap-1">
          {[ChevronLeft, ChevronRight].map((Icon, i) => (
            <button
              key={i}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#c5c5d3]/20 hover:bg-[#000f43]/5 text-[#000f43] transition-colors"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BankSync() {
  return (
    <div className="bg-[#002072] text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Building2 className="w-16 h-16" />
      </div>
      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-[#dde1ff]" />
        Sinkronisasi Bank
      </h3>
      <p className="text-[#dde1ff]/70 text-sm mb-4">
        Hubungkan rekening koran untuk rekonsiliasi otomatis real-time.
      </p>
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
              BCA
            </div>
            <div>
              <p className="text-xs font-bold">KlikBCA Bisnis</p>
              <p className="text-[10px] text-white/50">Terakhir: 1 jam yang lalu</p>
            </div>
          </div>
          <Check className="w-4 h-4 text-[#6ffbbe]" />
        </div>
      </div>
      <button className="w-full py-2.5 bg-white text-[#000f43] font-bold rounded-xl text-sm hover:bg-[#dde1ff] transition-colors">
        Tambah Koneksi Bank
      </button>
    </div>
  );
}

function ErpIntegration() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-[#c5c5d3]/10 border-l-4 border-[#00a472]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#000f43]/5 rounded-lg flex items-center justify-center">
            <Link2 className="w-5 h-5 text-[#000f43]" />
          </div>
          <div>
            <h3 className="font-bold text-[#000f43] text-sm">Integrasi ERP</h3>
            <p className="text-xs text-[#57657a]">Sinkronisasi Data Eksternal</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#6ffbbe] text-[#002113] rounded-full text-[10px] font-black uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-[#002113] rounded-full animate-pulse" />
          Aktif
        </span>
      </div>
      <div className="p-4 bg-[#f2f3ff] rounded-xl flex items-center justify-between">
        <span className="font-bold text-[#000f43] text-sm">Accurate ERP</span>
        <button className="text-[10px] font-bold text-[#000f43] underline underline-offset-4">
          Konfigurasi
        </button>
      </div>
    </div>
  );
}

function AiChat() {
  return (
    <div className="bg-[#dae2fd] rounded-2xl shadow-sm border border-[#c5c5d3]/10 flex flex-col h-[380px] overflow-hidden">
      <div className="p-4 border-b border-[#c5c5d3]/10 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#000f43] rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#000f43] text-sm">Tanya FiniCore</h3>
            <p className="text-[10px] text-[#00a472] font-semibold">AI Assistant Online</p>
          </div>
        </div>
        <button className="text-[#57657a] hover:text-[#000f43]">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f2f3ff]/30">
        {CHAT_MESSAGES.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-[#000f43]/10 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-[#000f43]" />
              </div>
            )}
            <div
              className={`p-3 text-xs leading-relaxed shadow-sm max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-[#000f43] text-white rounded-2xl rounded-tr-none'
                  : 'bg-white text-[#131b2e] rounded-2xl rounded-tl-none border border-[#c5c5d3]/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t border-[#c5c5d3]/10">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Tanyakan sesuatu..."
            className="w-full pl-4 pr-10 py-2.5 bg-[#f2f3ff] border-none rounded-xl text-xs focus:ring-2 focus:ring-[#000f43]/20 outline-none"
          />
          <button className="absolute right-2 text-[#000f43]">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProcessingToast() {
  return (
    <div className="fixed bottom-8 right-8 z-50 bg-white/80 backdrop-blur-md border border-[#c5c5d3]/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4 ring-1 ring-[#000f43]/10">
      <div className="w-10 h-10 bg-[#000f43] rounded-full flex items-center justify-center shadow-inner">
        <RefreshCw className="w-5 h-5 text-white animate-spin" />
      </div>
      <div>
        <p className="font-bold text-[#000f43] text-sm">AI Sedang Memproses</p>
        <p className="text-[10px] text-[#57657a] font-medium">2 dokumen baru sedang dianalisis...</p>
      </div>
      <button className="ml-4 p-1.5 hover:bg-[#eaedff] rounded-lg transition-colors">
        <X className="w-4 h-4 text-[#57657a]" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function JurnalOtomatisPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#faf8ff] p-8 lg:p-12">
        {/* Header */}
        <header className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-4xl font-extrabold text-[#000f43] tracking-tight mb-2">
              Jurnal Otomatis
            </h2>
            <p className="text-[#57657a] text-lg">Otomatisasi pencatatan keuangan cerdas.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#e2e7ff] text-[#000f43] font-semibold hover:bg-[#dae2fd] transition-colors">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#000f43] text-white text-lg font-bold shadow-2xl shadow-[#000f43]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Upload className="w-6 h-6" />
              <span>Impor Dokumen</span>
            </button>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left — ledger */}
          <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <SummaryStats />
            <LedgerTable />
          </section>

          {/* Right — utilities */}
          <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <BankSync />
            <ErpIntegration />
            <AiChat />
          </section>
        </div>

        <ProcessingToast />
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/hr')({
  beforeLoad: async () => {
    await requireAuthBeforeLoad();
  },
  component: JurnalOtomatisPage,
});