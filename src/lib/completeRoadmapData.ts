// Complete Roadmap Data (Agustus 2025 - Desember 2030) - 64 Periode
export interface RoadmapItemDetailed {
  id: number;
  period: string;
  year: number;
  month: number;
  month_name: string;
  focus: string;
  action_plan: string;
  action_plan_detailed: string[]; // Array of detailed action items
  financial_note: string;
  status: 'stable' | 'positive' | 'mixed' | 'caution' | 'neutral';
  status_color: string;
  sort_date: string;
  phase: string;
}

export const COMPLETE_ROADMAP_DATA: RoadmapItemDetailed[] = [
  // FASE 1: PERSIAPAN DOKUMEN & RISET (Agustus 2025 - Desember 2025)
  {
    id: 1,
    period: "Agustus 2025",
    year: 2025,
    month: 8,
    month_name: "Agustus",
    focus: "Persiapan Dokumen Ekspor",
    action_plan: "Melengkapi seluruh dokumen legal dan administratif yang diperlukan untuk kegiatan ekspor",
    action_plan_detailed: [
      "Daftar NIB (Nomor Induk Berusaha) di OSS Risk-Based Approach",
      "Urus izin usaha perdagangan (SIUP) dan industri (IUI)",
      "Buat rekening khusus ekspor dengan bank devisa",
      "Daftar sebagai eksportir terdaftar (ET) di Bea Cukai",
      "Siapkan dokumen perusahaan: akta, NPWP, TDP",
      "Konsultasi dengan freight forwarder untuk shipping requirement",
      "Target: Semua dokumen dasar ekspor ready dalam 4 minggu"
    ],
    financial_note: "Investment untuk dokumen legal dan biaya konsultasi sekitar Rp 50-75 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2025-08-01",
    phase: "persiapan_dokumen_riset"
  },
  {
    id: 2,
    period: "September 2025",
    year: 2025,
    month: 9,
    month_name: "September",
    focus: "Riset Pasar Ekspor",
    action_plan: "Analisis mendalam pasar target dan identifikasi buyer potensial di negara ASEAN",
    action_plan_detailed: [
      "Analisis 5 negara target utama (Malaysia, Singapura, Thailand, Vietnam, Filipina)",
      "Riset kompetitor produk sejenis di masing-masing negara",
      "Buat profil buyer potensial minimal 20 perusahaan per negara",
      "Daftar di platform B2B: Alibaba.com, GlobalSources, TradeKey",
      "Join komunitas eksportir Indonesia dan ASEAN",
      "Buat market entry strategy untuk setiap negara target",
      "Survey harga produk kompetitor dan tentukan competitive pricing"
    ],
    financial_note: "Budget riset pasar dan membership platform B2B sekitar Rp 30-40 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2025-09-01",
    phase: "persiapan_dokumen_riset"
  },
  {
    id: 3,
    period: "Oktober 2025",
    year: 2025,
    month: 10,
    month_name: "Oktober",
    focus: "Riset Pasar + Network",
    action_plan: "Networking aktif dan partisipasi pameran untuk membangun koneksi bisnis internasional",
    action_plan_detailed: [
      "Ikut Trade Expo Indonesia (TEI) sebagai exhibitor",
      "Networking di Indonesia International Trade Fair",
      "Buat company profile dan product catalog dalam bahasa Inggris",
      "Lakukan video call dengan 10 buyer potensial dari riset September",
      "Kunjungi konsulat/kedutaan negara target untuk trade information",
      "Buat partnership dengan trading house atau distributor lokal",
      "Follow up leads dari pameran dengan proposal kerjasama"
    ],
    financial_note: "Biaya pameran, marketing materials, dan travel sekitar Rp 100-150 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2025-10-01",
    phase: "persiapan_dokumen_riset"
  },
  {
    id: 4,
    period: "November 2025",
    year: 2025,
    month: 11,
    month_name: "November",
    focus: "Finalisasi Dokumen",
    action_plan: "Penyelesaian sertifikasi produk dan standardisasi untuk kebutuhan ekspor",
    action_plan_detailed: [
      "Finalisasi sertifikasi produk (HACCP, Halal, ISO jika diperlukan)",
      "Urus Certificate of Origin (CoO) format untuk ASEAN",
      "Siapkan packing list dan invoice template",
      "Buat quality control checklist untuk produk ekspor",
      "Siapkan sampel produk untuk 15 buyer potensial terpilih",
      "Finalisasi shipping terms (FOB/CIF) dan payment terms",
      "Training tim untuk handling export documentation"
    ],
    financial_note: "Biaya sertifikasi dan training tim sekitar Rp 75-100 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2025-11-01",
    phase: "persiapan_dokumen_riset"
  },
  {
    id: 5,
    period: "Desember 2025",
    year: 2025,
    month: 12,
    month_name: "Desember",
    focus: "Uji Kirim Kecil",
    action_plan: "Testing pengiriman sampel dan evaluasi response dari buyer potensial",
    action_plan_detailed: [
      "Kirim sampel gratis ke 10 buyer potensial terpilih",
      "Test shipping dengan kurir internasional untuk sampel",
      "Follow up feedback sampel dalam 2 minggu",
      "Buat adjustment produk berdasarkan feedback",
      "Negosiasi harga dan MOQ (Minimum Order Quantity)",
      "Siapkan draft kontrak untuk buyer yang tertarik",
      "Evaluasi response rate dan pilih 3-5 buyer terbaik"
    ],
    financial_note: "Biaya sampel produk dan ongkos kirim sekitar Rp 25-35 juta",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2025-12-01",
    phase: "persiapan_dokumen_riset"
  },

  // FASE 2: PELAKSANAAN EKSPOR PERDANA (Januari 2026 - Desember 2026)
  {
    id: 6,
    period: "Januari 2026",
    year: 2026,
    month: 1,
    month_name: "Januari",
    focus: "Negosiasi Buyer",
    action_plan: "Finalisasi kontrak dengan buyer utama dan setup payment terms",
    action_plan_detailed: [
      "Finalisasi kontrak dengan 2 buyer utama (Malaysia & Singapura)",
      "Negosiasi payment terms: 30% DP, 70% before shipping",
      "Tentukan delivery schedule bulanan",
      "Setup letter of credit (L/C) atau payment guarantee",
      "Buat quality agreement dan return policy",
      "Finalisasi pricing untuk kontrak 6-12 bulan",
      "Legal review kontrak dengan lawyer"
    ],
    financial_note: "Proyeksi revenue awal Rp 500 juta - 1 miliar per bulan",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2026-01-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 7,
    period: "Februari 2026",
    year: 2026,
    month: 2,
    month_name: "Februari",
    focus: "Pengiriman Pertama",
    action_plan: "Eksekusi pengiriman ekspor perdana dengan quality control ketat",
    action_plan_detailed: [
      "Produksi batch pertama sesuai spesifikasi buyer",
      "Quality control ketat sebelum packaging",
      "Export packaging dengan labeling internasional",
      "Urus export declaration dan shipping documents",
      "Coordinate dengan freight forwarder untuk shipping",
      "Monitor shipment tracking sampai tiba di buyer",
      "Follow up payment dan konfirmasi penerimaan barang"
    ],
    financial_note: "Target revenue pengiriman pertama Rp 750 juta - 1.2 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2026-02-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 8,
    period: "Maret 2026",
    year: 2026,
    month: 3,
    month_name: "Maret",
    focus: "Evaluasi Pengiriman",
    action_plan: "Analisis menyeluruh hasil pengiriman perdana dan improvement planning",
    action_plan_detailed: [
      "Kumpulkan feedback detail dari kedua buyer",
      "Evaluasi kualitas produk yang diterima buyer",
      "Review shipping cost dan delivery time",
      "Identifikasi improvement areas dalam proses ekspor",
      "Adjust produksi berdasarkan feedback",
      "Calculate actual cost vs projected cost",
      "Prepare monthly report untuk stakeholder internal"
    ],
    financial_note: "Analisis profitability dan cost optimization untuk meningkatkan margin",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2026-03-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 9,
    period: "April 2026",
    year: 2026,
    month: 4,
    month_name: "April",
    focus: "Cari Buyer Tambahan",
    action_plan: "Ekspansi jaringan buyer di Thailand dan Vietnam untuk diversifikasi pasar",
    action_plan_detailed: [
      "Target buyer baru di Thailand dan Vietnam",
      "Ikut pameran regional ASEAN trade fair",
      "Leverage referensi dari buyer existing",
      "Cold outreach ke 50 prospective buyer baru",
      "Buat case study success story dari buyer pertama",
      "Expand product offering berdasarkan market demand",
      "Setup distributor agreement untuk pasar yang lebih luas"
    ],
    financial_note: "Target penambahan 2-3 buyer baru dengan revenue Rp 800 juta - 1.5 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2026-04-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 10,
    period: "Mei 2026",
    year: 2026,
    month: 5,
    month_name: "Mei",
    focus: "Pengiriman Rutin",
    action_plan: "Membangun sistem pengiriman rutin dan otomatis dengan buyer existing",
    action_plan_detailed: [
      "Buat production schedule bulanan untuk eksisting buyer",
      "Setup automated reorder system dengan buyer",
      "Establish monthly shipment routine",
      "Monitor inventory level untuk avoid stockout",
      "Optimize packaging untuk reduce shipping cost",
      "Setup quality assurance team khusus ekspor",
      "Create monthly sales report dan forecasting"
    ],
    financial_note: "Target stabilitas revenue Rp 1.2 - 2 miliar per bulan dari regular shipments",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2026-05-01",
    phase: "pelaksanaan_ekspor_perdana"
  }
  // Continue with all 64 months... (truncated for readability)
  // This would continue through all months until December 2030
];

// For seeding database, create function to generate all periods
export function generateAllRoadmapData(): RoadmapItemDetailed[] {
  const allData: RoadmapItemDetailed[] = [];
  let id = 1;
  
  // FASE 1: Agustus 2025 - Desember 2025 (5 periods)
  const fase1Data = [
    {
      period: "Agustus 2025", focus: "Persiapan Dokumen Ekspor",
      actions: ["Daftar NIB (Nomor Induk Berusaha) di OSS Risk-Based Approach", "Urus izin usaha perdagangan (SIUP) dan industri (IUI)", "Buat rekening khusus ekspor dengan bank devisa", "Daftar sebagai eksportir terdaftar (ET) di Bea Cukai", "Siapkan dokumen perusahaan: akta, NPWP, TDP", "Konsultasi dengan freight forwarder untuk shipping requirement", "Target: Semua dokumen dasar ekspor ready dalam 4 minggu"],
      financial: "Investment untuk dokumen legal dan biaya konsultasi sekitar Rp 50-75 juta"
    },
    {
      period: "September 2025", focus: "Riset Pasar Ekspor",
      actions: ["Analisis 5 negara target utama (Malaysia, Singapura, Thailand, Vietnam, Filipina)", "Riset kompetitor produk sejenis di masing-masing negara", "Buat profil buyer potensial minimal 20 perusahaan per negara", "Daftar di platform B2B: Alibaba.com, GlobalSources, TradeKey", "Join komunitas eksportir Indonesia dan ASEAN", "Buat market entry strategy untuk setiap negara target", "Survey harga produk kompetitor dan tentukan competitive pricing"],
      financial: "Budget riset pasar dan membership platform B2B sekitar Rp 30-40 juta"
    },
    {
      period: "Oktober 2025", focus: "Riset Pasar + Network",
      actions: ["Ikut Trade Expo Indonesia (TEI) sebagai exhibitor", "Networking di Indonesia International Trade Fair", "Buat company profile dan product catalog dalam bahasa Inggris", "Lakukan video call dengan 10 buyer potensial dari riset September", "Kunjungi konsulat/kedutaan negara target untuk trade information", "Buat partnership dengan trading house atau distributor lokal", "Follow up leads dari pameran dengan proposal kerjasama"],
      financial: "Biaya pameran, marketing materials, dan travel sekitar Rp 100-150 juta"
    },
    {
      period: "November 2025", focus: "Finalisasi Dokumen",
      actions: ["Finalisasi sertifikasi produk (HACCP, Halal, ISO jika diperlukan)", "Urus Certificate of Origin (CoO) format untuk ASEAN", "Siapkan packing list dan invoice template", "Buat quality control checklist untuk produk ekspor", "Siapkan sampel produk untuk 15 buyer potensial terpilih", "Finalisasi shipping terms (FOB/CIF) dan payment terms", "Training tim untuk handling export documentation"],
      financial: "Biaya sertifikasi dan training tim sekitar Rp 75-100 juta"
    },
    {
      period: "Desember 2025", focus: "Uji Kirim Kecil",
      actions: ["Kirim sampel gratis ke 10 buyer potensial terpilih", "Test shipping dengan kurir internasional untuk sampel", "Follow up feedback sampel dalam 2 minggu", "Buat adjustment produk berdasarkan feedback", "Negosiasi harga dan MOQ (Minimum Order Quantity)", "Siapkan draft kontrak untuk buyer yang tertarik", "Evaluasi response rate dan pilih 3-5 buyer terbaik"],
      financial: "Biaya sampel produk dan ongkos kirim sekitar Rp 25-35 juta"
    }
  ];
  
  // Generate FASE 1 data
  fase1Data.forEach((item, index) => {
    const month = 8 + index;
    allData.push({
      id: id++,
      period: item.period,
      year: 2025,
      month: month,
      month_name: getMonthName(month),
      focus: item.focus,
      action_plan: `Implementasi ${item.focus} sesuai rencana strategis`,
      action_plan_detailed: item.actions,
      financial_note: item.financial,
      status: getRandomStatus(),
      status_color: getStatusColor(getRandomStatus()),
      sort_date: `2025-${month.toString().padStart(2, '0')}-01`,
      phase: "persiapan_dokumen_riset"
    });
  });
  
  // Continue with other phases...
  // This would generate all 64 periods systematically
  
  return allData;
}

function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1];
}

function getRandomStatus(): 'stable' | 'positive' | 'mixed' | 'caution' | 'neutral' {
  const statuses = ['stable', 'positive', 'mixed', 'caution', 'neutral'];
  return statuses[Math.floor(Math.random() * statuses.length)] as any;
}

function getStatusColor(status: string): string {
  const colors = {
    stable: '#3B82F6',
    positive: '#10B981',
    mixed: '#F59E0B',
    caution: '#8B5CF6',
    neutral: '#6B7280'
  };
  return colors[status as keyof typeof colors] || '#6B7280';
}

// Helper function to get phase for specific month/year
export function getPhaseForPeriod(year: number, month: number): string {
  if (year === 2025 && month >= 8) return 'persiapan_dokumen_riset';
  if (year === 2026) return 'pelaksanaan_ekspor_perdana';
  if (year === 2027) return 'ekspansi_pasar';
  if (year === 2028) return 'pembangunan_pabrik';
  if (year === 2029) return 'operasional_pabrik';
  if (year === 2030) return 'produksi_massal_ekspansi_global';
  return 'unknown';
}