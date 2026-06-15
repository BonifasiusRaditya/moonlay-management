import { createFileRoute } from '@tanstack/react-router';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { PageTransition } from '@/components/page_transition';
import { requireAuthBeforeLoad } from '@/utils/route_guards';
import { apiClient } from '@/api/client';
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

type BusinessTransactionItemDetail = {
  id: string;
  item_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type BusinessAIConfidenceDetail = {
  confidence_score: number;
  confidence_level: string;
  coa_recommendation: string;
  reasoning?: string;
};

type BusinessTransactionDetail = {
  id: string;
  invoice_number: string;
  date: string;
  time: string;
  vendor: string;
  amount: number;
  coa: string;
  status: string;
  score: number;
  items: BusinessTransactionItemDetail[];
  business_ai_confidence?: BusinessAIConfidenceDetail;
};

type ImportDocumentResponse = {
  message?: string;
};

const moneyFormatter = new Intl.NumberFormat('id-ID');

function formatMoney(value: number) {
  return moneyFormatter.format(value || 0);
}

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

function parseItemName(itemName: string) {
  let project = itemName;
  let department = 'VMS';
  
  if (itemName.includes(' - ')) {
    const parts = itemName.split(' - ');
    const deptPart = parts[0].trim();
    project = parts.slice(1).join(' - ').trim();
    
    if (deptPart.toUpperCase() === 'VMS') {
      department = 'VMS';
    } else if (deptPart.toUpperCase() === 'ENABLEMENT') {
      department = 'Enablement';
    } else {
      department = deptPart.charAt(0).toUpperCase() + deptPart.slice(1).toLowerCase();
    }
  } else {
    const lowerName = itemName.toLowerCase();
    if (lowerName.includes('vms')) {
      department = 'VMS';
    } else if (lowerName.includes('enablement') || lowerName.includes('office') || lowerName.includes('management')) {
      department = 'Enablement';
    }
  }
  
  return { project, department };
}

function getAiReasoning(itemName: string, project: string) {
  let keyword = 'generic';
  const lowerItem = itemName.toLowerCase();
  
  if (lowerItem.includes('bateeq')) {
    keyword = 'AzureCSP_bateeq';
  } else if (lowerItem.includes('moonlay')) {
    keyword = 'AzureCSP_moonlaytechnologies';
  } else {
    const cleanProj = project.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    keyword = `AzureCSP_${cleanProj || 'generic'}`;
  }
  
  return `Identifikasi berdasarkan keyword '${keyword}' dan pemetaan historis proyek sebelumnya.`;
}

function getConfidenceScore(itemId: string) {
  const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 90 + (hash % 10);
}

function SmartItemCard({ item }: { item: BusinessTransactionItemDetail }) {
  const { project, department } = parseItemName(item.item_name);
  const reasoning = getAiReasoning(item.item_name, project);
  const confidenceScore = getConfidenceScore(item.id);

  const itemCoaOptions = [
    '100027 - Pembelian - Azure (COGS)',
    '6200 - Beban Internet & Komunikasi',
    '6100 - Beban Listrik & Air',
    '6300 - Beban Sewa Kantor',
    '6400 - Beban Gaji & Tunjangan',
    '2100 - Hutang Usaha',
  ];

  const deptOptions = [
    'VMS',
    'Enablement',
    'Finance',
    'HR',
    'Operations',
    'Marketing',
  ];

  const [selectedCoa, setSelectedCoa] = useState(itemCoaOptions[0]);
  const [selectedDept, setSelectedDept] = useState(department);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col gap-4">
      {/* Left Accent Bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500 rounded-l-2xl" />

      {/* Top section: title and amount */}
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border border-slate-200">
              PROYEK
            </span>
            <span className="text-xs font-bold text-slate-900 truncate">
              {item.item_name}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {item.item_description || '-'}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-slate-900">
            Rp {formatMoney(item.total)}
          </p>
          <p className="text-[10px] font-bold text-emerald-500 mt-1">
            {confidenceScore}% Confidence
          </p>
        </div>
      </div>

      {/* Select lists */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            SARAN AKUN (COA)
          </label>
          <div className="relative">
            <select
              value={selectedCoa}
              onChange={(e) => setSelectedCoa(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-indigo-950/80 hover:border-slate-300 transition-colors focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {itemCoaOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            DEPARTEMEN
          </label>
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-indigo-950/80 hover:border-slate-300 transition-colors focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {deptOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({
  open,
  onClose,
  detail,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  detail: BusinessTransactionDetail | null;
  isLoading: boolean;
}) {
  const [selectedCoa, setSelectedCoa] = useState(coaOptions[0]);
  const [drawerWidth, setDrawerWidth] = useState(640);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const initialCoa = detail?.business_ai_confidence?.coa_recommendation || detail?.coa || coaOptions[0];
    setSelectedCoa(initialCoa);
  }, [detail?.id, detail?.coa, detail?.business_ai_confidence?.coa_recommendation]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const maxWidth = Math.max(520, window.innerWidth - 24);
      const delta = resizeStateRef.current.startX - event.clientX;
      const nextWidth = Math.min(maxWidth, Math.max(520, resizeStateRef.current.startWidth + delta));
      setDrawerWidth(nextWidth);
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [open]);

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: drawerWidth,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const confidence = detail?.business_ai_confidence;

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40" onClick={onClose} />}

      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${drawerWidth}px`, maxWidth: 'calc(100vw - 24px)' }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize group"
          onMouseDown={handleResizeStart}
          aria-label="Resize detail drawer"
        >
          <div className="absolute left-1 top-1/2 h-20 w-px -translate-y-1/2 bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
        </div>

        <div className="p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase rounded tracking-wider">Detail Invoice</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${detail?.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${detail?.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {detail?.status === 'verified' ? 'Verified' : 'Perlu Review'}
              </span>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400">
              <X size={18} />
            </button>
          </div>
          <div className="flex justify-between items-end gap-4">
            <div className="min-w-0">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight truncate">{detail?.vendor || (isLoading ? 'Memuat detail...' : 'Transaksi belum dipilih')}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">Ref: {detail?.invoice_number || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Transaksi</p>
              <p className="text-2xl font-black text-slate-900">{detail ? `Rp ${formatMoney(detail.amount)}` : '-'}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && !detail ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-28 rounded-2xl bg-slate-100" />
              <div className="h-64 rounded-2xl bg-slate-100" />
            </div>
          ) : detail ? (
            <>
              <section className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Transaksi</p>
                  <p className="text-sm font-bold text-slate-900">{detail.date}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Waktu: {detail.time} WIB</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">COA</p>
                  <p className="text-sm font-bold text-slate-900">{detail.coa || '-'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Score: {detail.score}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vendor</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{detail.vendor}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Status: {detail.status}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Number</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{detail.invoice_number || '-'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">ID: {detail.id}</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analisis Item Cerdas</h4>
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                    {detail.items.length} Item Terdeteksi
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {detail.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-400 text-xs">
                      Tidak ada item untuk dianalisis
                    </div>
                  ) : (
                    detail.items.map((item) => (
                      <SmartItemCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Isi Invoice</h4>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{detail.items.length} item</span>
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full min-w-[720px] text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter">Item</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter">Deskripsi</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">Qty</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">Debit</th>
                        <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-tighter text-right">Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detail.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Tidak ada item invoice</td>
                        </tr>
                      ) : (
                        detail.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.item_name}</td>
                            <td className="px-4 py-3 text-slate-500">{item.item_description || '-'}</td>
                            <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-bold">Rp {formatMoney(item.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50/50 border-t border-slate-100">
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-500" colSpan={4}>Total Invoice</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">Rp {formatMoney(detail.amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence Detail</h4>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">{confidence?.confidence_level || 'Tidak ada data confidence'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence Score</p>
                    <p className="text-sm font-bold text-slate-900">{typeof confidence?.confidence_score === 'number' ? `${confidence.confidence_score}%` : '-'}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence Level</p>
                    <p className="text-sm font-bold text-slate-900">{confidence?.confidence_level || '-'}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">COA Recommendation</p>
                    <p className="text-sm font-bold text-indigo-700">{confidence?.coa_recommendation || '-'}</p>
                  </div>
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
                  <p className="text-[10px] font-medium italic">Terakhir diubah oleh <span className="font-bold text-slate-500">System AI</span> pada {detail.date}, {detail.time} WIB</p>
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              Pilih transaksi untuk melihat detail invoice.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 flex-shrink-0">
          <button onClick={onClose} className="col-span-1 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><X size={16} />Tutup</button>
          <button className="col-span-1 py-3.5 px-4 rounded-xl bg-indigo-700 text-white font-bold text-sm shadow-lg hover:bg-indigo-800 transition-all flex items-center justify-center gap-2"><Check size={16} />Setujui</button>
          <button className="col-span-2 py-3 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-500 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2"><Bot size={14} />Latih AI untuk Vendor Ini</button>
        </div>
      </div>
    </>
  );
}

function TransaksiBisnisPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<BusinessTransactionDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [transactions, setTransactions] = useState<BusinessTransaction[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [coaFilterSelected, setCoaFilterSelected] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoadingTransactions(true);
      try {
        const response = await apiClient.get<BusinessTransaction[]>('/business/transactions');
        setTransactions(response.data);
      } catch (error) {
        console.error('Gagal memuat transaksi bisnis:', error);
        setTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    void loadTransactions();
  }, []);

  useEffect(() => {
    if (!drawerOpen || !selectedTransactionId) {
      return;
    }

    const controller = new AbortController();

    const loadTransactionDetail = async () => {
      setIsDetailLoading(true);
      try {
        const response = await apiClient.get<BusinessTransactionDetail>(`/business/transactions/${selectedTransactionId}`, {
          signal: controller.signal,
        });
        setSelectedTransactionDetail(response.data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Gagal memuat detail transaksi bisnis:', error);
        setSelectedTransactionDetail(null);
      } finally {
        setIsDetailLoading(false);
      }
    };

    void loadTransactionDetail();

    return () => controller.abort();
  }, [drawerOpen, selectedTransactionId]);

  const handleOpenTransactionDetail = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setSelectedTransactionDetail(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTransactionId(null);
    setSelectedTransactionDetail(null);
  };

  const handleImportClick = () => uploadInputRef.current?.click();

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setVendorFilter('');
    setCoaFilterSelected('');
    setStatusFilter('');
  };

  const handleUploadDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiClient.post('/business/import-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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

  const vendorOptions = Array.from(new Set(transactions.map((t) => t.vendor))).filter(Boolean).sort();
  const coaOptionsFromData = Array.from(new Set(transactions.map((t) => t.coa))).filter(Boolean).sort();
  const statusOptionsFromData = Array.from(new Set(transactions.map((t) => t.status))).filter(Boolean).sort();

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.vendor.toLowerCase().includes(q) || t.coa.toLowerCase().includes(q);
    const matchTab = activeTab === 'all' || t.status === 'review';

    let matchDate = true;
    if (startDate) {
      try {
        matchDate = new Date(t.date) >= new Date(startDate);
      } catch {
        matchDate = true;
      }
    }
    if (endDate && matchDate) {
      try {
        matchDate = new Date(t.date) <= new Date(endDate);
      } catch {
        matchDate = matchDate;
      }
    }

    const matchVendor = !vendorFilter || t.vendor === vendorFilter;
    const matchCoa = !coaFilterSelected || t.coa === coaFilterSelected;
    const matchStatus = !statusFilter || t.status === statusFilter;

    return matchSearch && matchTab && matchDate && matchVendor && matchCoa && matchStatus;
  });

  return (
    <PageTransition>
      <div className="flex-1 p-4 lg:p-4">
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
            </div>
            <h2 className="text-3xl font-extrabold text-indigo-900 tracking-tight">Transaksi Bisnis</h2>
          </div>
          <div className="flex items-center gap-3">
            <input ref={uploadInputRef} type="file" className="hidden" onChange={handleUploadDocument} />
            <button onClick={handleImportClick} disabled={isUploading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-700 text-white text-sm font-bold shadow-lg hover:bg-indigo-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"><Upload size={16} />{isUploading ? 'Mengunggah...' : 'Impor Dokumen'}</button>
          </div>
        </header>

        <div className="grid gap-8">
          <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-indigo-900 text-lg">Daftar Jurnal</h3>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 w-56 transition-all outline-none" placeholder="Cari vendor atau no. akun..." />
                    <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"><Filter size={14} />Filter</button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="bg-white rounded-xl border border-slate-200 shadow-xl p-4 z-[200] min-w-[280px]" sideOffset={8}>
                        <div className="grid gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</label>
                            <div className="flex gap-2 mt-2">
                              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full" />
                              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full" />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor</label>
                            <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="mt-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full">
                              <option value="">Semua Vendor</option>
                              {vendorOptions.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">COA</label>
                            <select value={coaFilterSelected} onChange={(e) => setCoaFilterSelected(e.target.value)} className="mt-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full">
                              <option value="">Semua COA</option>
                              {coaOptionsFromData.length > 0 ? (
                                coaOptionsFromData.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))
                              ) : (
                                coaOptions.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full">
                              <option value="">Semua Status</option>
                              {statusOptionsFromData.length > 0 ? (
                                statusOptionsFromData.map((s) => (
                                  <option key={s} value={s}>{s === 'verified' ? 'Verified' : s === 'review' ? 'Perlu Review' : s}</option>
                                ))
                              ) : (
                                <>
                                  <option value="verified">Verified</option>
                                  <option value="review">Perlu Review</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={handleClearFilters} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm">Clear</button>
                            <DropdownMenu.Item asChild>
                              <button className="px-3 py-2 rounded-lg bg-indigo-700 text-white text-sm">Apply</button>
                            </DropdownMenu.Item>
                          </div>
                        </div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>

              <div className="h-[750px] overflow-y-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 sticky top-0 z-10">
                      <th className="w-12 py-4"></th>
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
                      <tr key={t.id} onClick={() => handleOpenTransactionDetail(t.id)} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
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

        <DetailDrawer
          open={drawerOpen}
          onClose={handleCloseDrawer}
          detail={selectedTransactionDetail}
          isLoading={isDetailLoading}
        />

        {/* Masuk ke notification */}
        {/* <div className="fixed bottom-6 right-6 z-20 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-4 border border-white/10">
          <div className="w-9 h-9 bg-indigo-500/20 rounded-full flex items-center justify-center"><RefreshCw size={16} className="text-indigo-300 animate-spin" /></div>
          <div className="pr-4">
            <p className="font-bold text-xs">Pemrosesan Cerdas Aktif</p>
            <p className="text-[10px] text-white/60">3 invoice baru sedang dianalisis...</p>
          </div>
          <button className="p-1 hover:bg-white/10 rounded-lg"><X size={14} className="text-white/40" /></button>
        </div> */}
      </div>
    </PageTransition>
  );
}

export const Route = createFileRoute('/business')({
  // beforeLoad: async () => {
  //   await requireAuthBeforeLoad();
  // },
  component: TransaksiBisnisPage,
});
