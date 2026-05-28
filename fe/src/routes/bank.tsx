import { createFileRoute } from '@tanstack/react-router';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PageTransition } from '@/components/page_transition';
import { requireAuthBeforeLoad } from '@/utils/route_guards';
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Filter,
  RefreshCw,
  Search,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

type BusinessTransaction = {
  id: string;
  date: string;
  time: string;
  vendor: string;
  initials: string;
  amount: string;
  coa: string;
  score: number;
  status: string;
};

type ImportDocumentResponse = {
  message?: string;
};

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

function DetailDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedCoa, setSelectedCoa] = useState(coaOptions[0]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40" onClick={onClose} />}

      <div
        className={`fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase rounded tracking-wider">Invoice Pembelian</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-tight border border-amber-100">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                Perlu Review
              </span>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400">
              <X size={18} />
            </button>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Biznet Networks</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Ref: INV/20230811/BIZ/990</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Transaksi</p>
              <p className="text-2xl font-black text-slate-900">Rp 8.200.000</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Transaksi</p>
              <p className="text-sm font-bold text-slate-900">11 Agustus 2023</p>
              <p className="text-[10px] text-slate-500 font-medium">Waktu: 10:45 WIB</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Metode Pembayaran</p>
              <p className="text-sm font-bold text-slate-900">Transfer Bank (BCA)</p>
              <p className="text-[10px] text-slate-500 font-medium">Acc: **********8821</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klasifikasi AI</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Akurasi Tinggi</span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[94%]" /></div>
                <span className="text-xs font-black text-emerald-600">94.2%</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-700 rounded-l-xl" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0"><Bot size={20} className="text-indigo-700" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saran COA</p>
                  <p className="text-base font-bold text-indigo-700">6200 - Beban Internet & Komunikasi</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Bot size={12} />Penalaran AI</p>
              <div className="bg-white/70 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 leading-relaxed italic">"Pencocokan keyword 'Dedicated Internet' pada metadata invoice ditemukan dengan tingkat kepercayaan tinggi. Vendor 'Biznet' memiliki probabilitas 98% terhubung ke akun 6200 berdasarkan histori transaksi 12 bulan terakhir."</div>
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Draf Entri Jurnal</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter">Akun / Keterangan</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">Debit</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-4 py-3"><p className="font-semibold">6200 - Beban Internet</p><p className="text-[10px] text-slate-400">Biznet Networks</p></td>
                    <td className="px-4 py-3 text-right font-bold">8.200.000</td>
                    <td className="px-4 py-3 text-right text-slate-400">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3"><p className="font-semibold">2100 - Hutang Usaha</p><p className="text-[10px] text-slate-400">Biznet Networks</p></td>
                    <td className="px-4 py-3 text-right text-slate-400">—</td>
                    <td className="px-4 py-3 text-right font-bold">8.200.000</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50/50 border-t border-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-500">Total Balance</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">8.200.000</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">8.200.000</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Ubah Klasifikasi Manual</label>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-100">
                  <span>{selectedCoa}</span>
                  <ChevronRight size={16} className="text-slate-400 rotate-90" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-[200] min-w-[320px]" sideOffset={4}>
                  {coaOptions.map((opt) => (
                    <DropdownMenu.Item
                      key={opt}
                      onSelect={() => setSelectedCoa(opt)}
                      className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                    >
                      {opt}
                      {selectedCoa === opt && <Check size={14} className="text-indigo-600" />}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <p className="text-[10px] text-slate-400 mt-2 italic">Perubahan manual akan memicu proses pembelajaran AI untuk transaksi serupa di masa depan.</p>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400">
              <RefreshCw size={12} />
              <p className="text-[10px] font-medium italic">Terakhir diubah oleh <span className="font-bold text-slate-500">System AI</span> pada 11 Agu 2023, 10:45 WIB</p>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 flex-shrink-0">
          <button onClick={onClose} className="col-span-1 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><X size={16} />Tolak</button>
          <button className="col-span-1 py-3.5 px-4 rounded-xl bg-indigo-700 text-white font-bold text-sm shadow-lg hover:bg-indigo-800 transition-all flex items-center justify-center gap-2"><Check size={16} />Setujui</button>
          <button className="col-span-2 py-3 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-500 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2"><Bot size={14} />Latih AI untuk Vendor Ini</button>
        </div>
      </div>
    </>
  );
}

function TransaksiBisnisPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [transactions, setTransactions] = useState<BusinessTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoadingTransactions(true);
      try {
        const response = await fetch(`${apiBaseUrl}/bank/transaction`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Gagal memuat transaksi bisnis');
        }

        const data = (await response.json()) as BusinessTransaction[];
        setTransactions(data);
      } catch (error) {
        console.error('Gagal memuat transaksi bisnis:', error);
        setTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    void loadTransactions();
  }, [apiBaseUrl]);

  const handleImportClick = () => uploadInputRef.current?.click();

  const handleUploadDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiBaseUrl}/bank/import-document`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Upload gagal';
        try {
          const payload = (await response.json()) as ImportDocumentResponse;
          errorMessage = payload?.message || errorMessage;
        } catch {
          try {
            errorMessage = (await response.text()) || errorMessage;
          } catch {
            errorMessage = errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      alert('Berhasil di upload');
    } catch (error) {
      console.error('Gagal upload dokumen:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload dokumen gagal. Silakan coba lagi.';
      alert(errorMessage);
    } finally {
      event.target.value = '';
      setIsUploading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.vendor.toLowerCase().includes(q) || t.coa.toLowerCase().includes(q);
    const matchTab = activeTab === 'all' || t.status === 'review';
    return matchSearch && matchTab;
  });

  return (
    <PageTransition>
      <div className="flex-1 p-8 lg:p-10 max-w-[1600px]">
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
              <span>Fintech</span>
              <ChevronRight size={14} />
              <span className="text-indigo-700 font-bold">Transaksi Bisnis</span>
            </div>
            <h2 className="text-3xl font-extrabold text-indigo-900 tracking-tight">Transaksi Bisnis</h2>
          </div>
          <div className="flex items-center gap-3">
            <input ref={uploadInputRef} type="file" className="hidden" onChange={handleUploadDocument} />
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"><FileText size={16} />Ekspor</button>
            <button onClick={handleImportClick} disabled={isUploading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-700 text-white text-sm font-bold shadow-lg hover:bg-indigo-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"><Upload size={16} />{isUploading ? 'Mengunggah...' : 'Impor Dokumen'}</button>
          </div>
        </header>

        <div className="grid gap-8">
          <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-indigo-900 text-lg">Daftar Jurnal</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setActiveTab('all')} className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${activeTab === 'all' ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-50'}`}>Semua</button>
                    <button onClick={() => setActiveTab('pending')} className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${activeTab === 'pending' ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}>Pending</button>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 w-56 transition-all outline-none" placeholder="Cari vendor atau no. akun..." />
                    <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"><Filter size={14} />Filter</button>
                </div>
              </div>

              <div className="h-[750px] overflow-y-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 sticky top-0 z-10">
                      <th className="w-12 px-6 py-4"><input type="checkbox" className="rounded border-slate-300 w-4 h-4" /></th>
                      {['Tanggal', 'Vendor', 'Jumlah', 'COA', 'Score', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Cloud size={32} className="mx-auto mb-2" />
                          <p className="font-bold text-sm">{isLoadingTransactions ? 'Memuat transaksi...' : 'Tidak ada transaksi yang ditemukan'}</p>
                          <p className="text-[10px] mt-1">{isLoadingTransactions ? 'Menunggu data dari backend.' : 'Coba sesuaikan kata kunci pencarian atau filter yang digunakan.'}</p>
                        </td>
                      </tr>
                    )}
                    {filtered.map((t) => (
                      <tr key={t.id} onClick={() => setDrawerOpen(true)} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                        <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 w-4 h-4" onClick={(e) => e.stopPropagation()} /></td>
                        <td className="px-4 py-4"><p className="font-bold text-indigo-800 text-sm">{t.date}</p><p className="text-[10px] text-slate-400 font-medium">{t.time}</p></td>
                        <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">{t.initials}</div><p className="font-bold text-slate-900 text-sm truncate">{t.vendor}</p></div></td>
                        <td className="px-4 py-4 text-right"><p className="font-bold text-slate-900 text-sm">{t.amount}</p><p className="text-[9px] text-slate-400 uppercase font-bold">IDR</p></td>
                        <td className="px-4 py-4"><div className="flex items-center justify-center"><CoaBadge coa={t.coa} status={t.status} /></div></td>
                        <td className="px-4 py-4 text-center"><span className={`text-xs font-bold ${t.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{t.score}%</span></td>
                        <td className="px-6 py-4 text-center"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-slate-50 flex justify-between items-center rounded-b-2xl">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total {filtered.length} transaksi dalam daftar jurnal</p>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"><ChevronLeft size={14} className="text-slate-500" /></button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"><ChevronRight size={14} className="text-slate-500" /></button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <DetailDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <div className="fixed bottom-6 right-6 z-20 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 border border-white/10">
          <div className="w-9 h-9 bg-indigo-500/20 rounded-full flex items-center justify-center"><RefreshCw size={16} className="text-indigo-300 animate-spin" /></div>
          <div className="pr-4">
            <p className="font-bold text-xs">Pemrosesan Cerdas Aktif</p>
            <p className="text-[10px] text-white/60">3 invoice baru sedang dianalisis...</p>
          </div>
          <button className="p-1 hover:bg-white/10 rounded-lg"><X size={14} className="text-white/40" /></button>
        </div>
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/bank')({
  beforeLoad: async () => {
    await requireAuthBeforeLoad();
  },
  component: TransaksiBisnisPage,
});
