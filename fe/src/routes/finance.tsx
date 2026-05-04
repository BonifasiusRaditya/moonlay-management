import { createFileRoute } from '@tanstack/react-router';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

const transactions = [
  { id: 1, date: '12 Agu 23', time: '14:20 WIB', vendor: 'PLN Persero', initials: 'PL', amount: '12.450.000', coa: '6100 - Beban Listrik', score: 98, status: 'verified' },
  { id: 2, date: '11 Agu 23', time: '10:45 WIB', vendor: 'Biznet Networks', initials: 'BN', amount: '8.200.000', coa: '6200 - Beban Internet', score: 82, status: 'review' },
  { id: 3, date: '10 Agu 23', time: '09:15 WIB', vendor: 'Telkomsel', initials: 'TS', amount: '1.500.000', coa: '6200 - Beban Internet', score: 99, status: 'verified' },
  { id: 4, date: '09 Agu 23', time: '16:30 WIB', vendor: 'Grab Indonesia', initials: 'GR', amount: '450.000', coa: '6500 - Beban Perjalanan', score: 95, status: 'verified' },
  { id: 5, date: '08 Agu 23', time: '11:00 WIB', vendor: 'Tokopedia', initials: 'TK', amount: '2.100.000', coa: '6600 - Perlengkapan', score: 92, status: 'verified' },
  { id: 6, date: '07 Agu 23', time: '13:45 WIB', vendor: 'Amazon Web Services', initials: 'AZ', amount: '15.600.000', coa: '6200 - Beban Cloud', score: 98, status: 'verified' },
  { id: 7, date: '06 Agu 23', time: '10:20 WIB', vendor: 'PAM Jaya', initials: 'PD', amount: '1.200.000', coa: '6100 - Beban Air', score: 88, status: 'review' },
  { id: 8, date: '05 Agu 23', time: '15:10 WIB', vendor: 'Slack Technologies', initials: 'SL', amount: '3.400.000', coa: '6200 - Beban Software', score: 96, status: 'verified' },
  { id: 9, date: '04 Agu 23', time: '09:30 WIB', vendor: 'Microsoft 365', initials: 'MF', amount: '7.800.000', coa: '6200 - Beban Lisensi', score: 97, status: 'verified' },
  { id: 10, date: '03 Agu 23', time: '16:45 WIB', vendor: 'Gojek', initials: 'GO', amount: '320.000', coa: '6500 - Beban Kurir', score: 94, status: 'verified' },
  { id: 11, date: '02 Agu 23', time: '11:15 WIB', vendor: 'Facebook Ads', initials: 'FB', amount: '25.000.000', coa: '6700 - Beban Iklan', score: 99, status: 'verified' },
  { id: 12, date: '01 Agu 23', time: '14:00 WIB', vendor: 'Biznet Networks', initials: 'BN', amount: '8.200.000', coa: '6200 - Beban Internet', score: 100, status: 'verified' },
];

const aiSuggestions = [
  { vendor: 'Biznet Networks', coa: 'Beban Internet (6200)', amount: 'Rp 8.200.000', confidence: 94 },
  { vendor: 'PT. Maju', coa: 'Beban Operasional (6100)', amount: 'Rp 12.450.000', confidence: 98 },
  { vendor: 'Telkomsel', coa: 'Beban Komunikasi', amount: 'Rp 1.500.000', confidence: 92 },
  { vendor: 'Gojek / Grab', coa: 'Beban Perjalanan', amount: 'Rp 345.000', confidence: 88 },
];

const coaOptions = [
  '6200 - Beban Internet & Komunikasi',
  '6100 - Beban Listrik & Air',
  '6300 - Beban Sewa Kantor',
  '6400 - Beban Gaji & Tunjangan',
  '2100 - Hutang Usaha',
];

function StatusBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-tight border border-emerald-100">
        <span className="w-1 h-1 bg-emerald-500 rounded-full" />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-tight border border-amber-100">
      <span className="w-1 h-1 bg-amber-500 rounded-full" />
      Perlu Review
    </span>
  );
}

function CoaBadge({ coa, status }: { coa: string; status: string }) {
  const isReview = status === 'review';
  return (
    <span
      className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${
        isReview
          ? 'bg-amber-50 text-amber-600 border-amber-200'
          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
      }`}
    >
      {coa}
    </span>
  );
}

function DetailDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selectedCoa, setSelectedCoa] = useState(coaOptions[0]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase rounded tracking-wider">
                Invoice Pembelian
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-tight border border-amber-100">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                Perlu Review
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Biznet Networks
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Ref: INV/20230811/BIZ/990
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Transaksi
              </p>
              <p className="text-2xl font-black text-slate-900">Rp 8.200.000</p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Basic Details */}
          <section className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Tanggal Transaksi
              </p>
              <p className="text-sm font-bold text-slate-900">11 Agustus 2023</p>
              <p className="text-[10px] text-slate-500 font-medium">
                Waktu: 10:45 WIB
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Metode Pembayaran
              </p>
              <p className="text-sm font-bold text-slate-900">
                Transfer Bank (BCA)
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Acc: **********8821
              </p>
            </div>
          </section>

          {/* AI Insight */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Klasifikasi AI
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                  Akurasi Tinggi
                </span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[94%]" />
                </div>
                <span className="text-xs font-black text-emerald-600">94.2%</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-700 rounded-l-xl" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Bot size={20} className="text-indigo-700" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Saran COA
                  </p>
                  <p className="text-base font-bold text-indigo-700">
                    6200 - Beban Internet & Komunikasi
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Bot size={12} />
                Penalaran AI
              </p>
              <div className="bg-white/70 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 leading-relaxed italic">
                "Pencocokan keyword 'Dedicated Internet' pada metadata invoice
                ditemukan dengan tingkat kepercayaan tinggi. Vendor 'Biznet'
                memiliki probabilitas 98% terhubung ke akun 6200 berdasarkan
                histori transaksi 12 bulan terakhir."
              </div>
            </div>
          </section>

          {/* Journal Entry Draft */}
          <section>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Draf Entri Jurnal
            </h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter">
                      Akun / Keterangan
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">
                      Debit
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">
                      Kredit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-semibold">6200 - Beban Internet</p>
                      <p className="text-[10px] text-slate-400">Biznet Networks</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">8.200.000</td>
                    <td className="px-4 py-3 text-right text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-semibold">2100 - Hutang Usaha</p>
                      <p className="text-[10px] text-slate-400">Biznet Networks</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">—</td>
                    <td className="px-4 py-3 text-right font-bold">8.200.000</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50/50 border-t border-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-500">
                      Total Balance
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      8.200.000
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">
                      8.200.000
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Manual Classification */}
          <section>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              Ubah Klasifikasi Manual
            </label>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-100">
                  <span>{selectedCoa}</span>
                  <ChevronRight size={16} className="text-slate-400 rotate-90" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-[200] min-w-[320px]"
                  sideOffset={4}
                >
                  {coaOptions.map((opt) => (
                    <DropdownMenu.Item
                      key={opt}
                      onSelect={() => setSelectedCoa(opt)}
                      className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                    >
                      {opt}
                      {selectedCoa === opt && (
                        <Check size={14} className="text-indigo-600" />
                      )}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              Perubahan manual akan memicu proses pembelajaran AI untuk transaksi
              serupa di masa depan.
            </p>
          </section>

          {/* Audit Trail */}
          <section className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400">
              <RefreshCw size={12} />
              <p className="text-[10px] font-medium italic">
                Terakhir diubah oleh{' '}
                <span className="font-bold text-slate-500">System AI</span> pada
                11 Agu 2023, 10:45 WIB
              </p>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="col-span-1 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <X size={16} />
            Tolak
          </button>
          <button className="col-span-1 py-3.5 px-4 rounded-xl bg-indigo-700 text-white font-bold text-sm shadow-lg hover:bg-indigo-800 transition-all flex items-center justify-center gap-2">
            <Check size={16} />
            Setujui
          </button>
          <button className="col-span-2 py-3 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-500 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2">
            <Bot size={14} />
            Latih AI untuk Vendor Ini
          </button>
        </div>
      </div>
    </>
  );
}

function JurnalOtomatis() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || t.vendor.toLowerCase().includes(q) || t.coa.toLowerCase().includes(q);
    const matchTab = activeTab === 'all' || t.status === 'review';
    return matchSearch && matchTab;
  });

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        

        {/* Main */}
        <main className="flex-1 p-8 lg:p-10 max-w-[1600px]">
          {/* Header */}
          <header className="flex justify-between items-end mb-10">
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
                <span>Fintech</span>
                <ChevronRight size={14} />
                <span className="text-indigo-700 font-bold">Jurnal Otomatis</span>
              </div>
              <h2 className="text-3xl font-extrabold text-indigo-900 tracking-tight">
                Data Transaksi Cerdas
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all">
                <FileText size={16} />
                Ekspor
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-700 text-white text-sm font-bold shadow-lg hover:bg-indigo-800 transition-all">
                <Upload size={16} />
                Impor Dokumen
              </button>
            </div>
          </header>

          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:-translate-y-0.5 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ArrowRight size={20} className="text-emerald-500 rotate-90" />
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  +12.5%
                </span>
              </div>
              <p className="text-slate-500 text-xs font-semibold mb-1">
                Total Arus Masuk
              </p>
              <p className="text-2xl font-extrabold text-slate-900">Rp 2.84B</p>
              <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[70%]" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:-translate-y-0.5 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <ArrowRight size={20} className="text-red-500 -rotate-90" />
                </div>
                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                  -5.2%
                </span>
              </div>
              <p className="text-slate-500 text-xs font-semibold mb-1">
                Total Arus Keluar
              </p>
              <p className="text-2xl font-extrabold text-slate-900">Rp 1.42B</p>
              <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[40%]" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:-translate-y-0.5 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Cloud size={20} className="text-indigo-700" />
                </div>
              </div>
              <p className="text-slate-500 text-xs font-semibold mb-1">
                Arus Kas Bersih
              </p>
              <p className="text-2xl font-extrabold text-slate-900">Rp 1.42B</p>
              <p className="text-[10px] text-slate-400 font-medium mt-4 italic">
                Surplus bulan ini
              </p>
            </div>

            <div className="bg-indigo-700 text-white p-6 rounded-2xl hover:-translate-y-0.5 transition-transform shadow-xl shadow-indigo-200">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <span className="text-[10px] text-white/80 font-bold border border-white/20 px-2 py-0.5 rounded-full">
                  Insight
                </span>
              </div>
              <p className="text-white/70 text-xs font-semibold mb-1">
                Otomatisasi AI
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white">94.2%</span>
                <span className="text-[10px] font-medium text-white/60">
                  Efficiency
                </span>
              </div>
              <p className="text-[10px] text-white/50 font-medium mt-4 tracking-tight">
                88 Jurnal diproses otomatis
              </p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Table */}
            <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                {/* Table Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-indigo-900 text-lg">
                      Daftar Jurnal
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                          activeTab === 'all'
                            ? 'bg-slate-100 text-slate-600'
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                          activeTab === 'pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        Pending
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 w-56 transition-all outline-none"
                        placeholder="Cari vendor atau no. akun..."
                      />
                      <Search
                        size={15}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
                      <Filter size={14} />
                      Filter
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="h-[750px] overflow-y-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 sticky top-0 z-10">
                        <th className="w-12 px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 w-4 h-4"
                          />
                        </th>
                        {['Tanggal', 'Vendor', 'Jumlah', 'Saran AI (COA)', 'Score', 'Status'].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => setDrawerOpen(true)}
                          className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 w-4 h-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-bold text-indigo-800 text-sm">
                              {t.date}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {t.time}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                                {t.initials}
                              </div>
                              <p className="font-bold text-slate-900 text-sm truncate">
                                {t.vendor}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-bold text-slate-900 text-sm">
                              {t.amount}
                            </p>
                            <p className="text-[9px] text-slate-400 uppercase font-bold">
                              IDR
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center">
                              <CoaBadge coa={t.coa} status={t.status} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`text-xs font-bold ${
                                t.status === 'verified'
                                  ? 'text-emerald-500'
                                  : 'text-amber-500'
                              }`}
                            >
                              {t.score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-slate-50 flex justify-between items-center rounded-b-2xl">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Total {filtered.length} transaksi dalam daftar jurnal
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                      <ChevronLeft size={14} className="text-slate-500" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
              {/* Integration Status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-indigo-900">
                    Workspace Terintegrasi
                  </h3>
                  <Link2 size={18} className="text-slate-300" />
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center font-bold text-[10px] text-indigo-700">
                          BCA
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            KlikBCA Bisnis
                          </p>
                          <p className="text-[10px] text-emerald-500 font-medium">
                            Aktif • 1 jam lalu
                          </p>
                        </div>
                      </div>
                      <Check size={16} className="text-emerald-500" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Cloud size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Accurate ERP
                        </p>
                        <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded mt-0.5">
                          Connected
                        </span>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                      <Settings size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[420px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-900 text-xs tracking-tight uppercase">
                        Rekomendasi AI
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        4 Saran Menunggu
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
                  <button className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-indigo-700 text-[10px] font-bold uppercase tracking-widest transition-colors mb-2">
                    TERIMA SEMUA (4)
                  </button>
                  <div className="space-y-3">
                    {aiSuggestions.map((s) => (
                      <div
                        key={s.vendor}
                        className="p-3 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all bg-white"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              {s.vendor}
                            </h4>
                            <p className="text-[10px] font-semibold text-indigo-700 mt-0.5">
                              {s.coa}
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded">
                            {s.confidence}% Confidence
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-700 mb-3">
                          {s.amount}
                        </p>
                        <div className="flex gap-2">
                          <button className="flex-1 py-1.5 rounded-md border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            Abaikan
                          </button>
                          <button className="flex-1 py-1.5 rounded-md bg-indigo-700 text-white text-[10px] font-bold hover:bg-indigo-800 transition-all shadow-sm">
                            Setujui
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Detail Drawer */}
        <DetailDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Toast */}
        <div className="fixed bottom-6 right-6 z-20 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 border border-white/10">
          <div className="w-9 h-9 bg-indigo-500/20 rounded-full flex items-center justify-center">
            <RefreshCw size={16} className="text-indigo-300 animate-spin" />
          </div>
          <div className="pr-4">
            <p className="font-bold text-xs">Pemrosesan Cerdas Aktif</p>
            <p className="text-[10px] text-white/60">
              3 invoice baru sedang dianalisis...
            </p>
          </div>
          <button className="p-1 hover:bg-white/10 rounded-lg">
            <X size={14} className="text-white/40" />
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/finance')({
  beforeLoad: async () => {
    await requireAuthBeforeLoad();
  },
  component: JurnalOtomatis,
});