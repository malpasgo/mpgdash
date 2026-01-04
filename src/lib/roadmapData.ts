// Comprehensive Roadmap Data (Agustus 2025 - Desember 2030)
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

export const COMPREHENSIVE_ROADMAP_DATA: RoadmapItemDetailed[] = [
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
  },
  {
    id: 11,
    period: "Juni 2026",
    year: 2026,
    month: 6,
    month_name: "Juni",
    focus: "Optimasi Supply Chain",
    action_plan: "Optimasi biaya produksi dan supply chain untuk meningkatkan efisiensi",
    action_plan_detailed: [
      "Negosiasi harga bahan baku dengan supplier untuk volume discount",
      "Evaluate alternative supplier untuk backup",
      "Setup just-in-time inventory system",
      "Optimize warehouse layout untuk export operation",
      "Negotiate better shipping rates dengan freight forwarder",
      "Implement inventory management system",
      "Cost analysis untuk identify saving opportunities"
    ],
    financial_note: "Target cost reduction 10-15% untuk meningkatkan profit margin",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2026-06-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 12,
    period: "Juli 2026",
    year: 2026,
    month: 7,
    month_name: "Juli",
    focus: "Branding Produk",
    action_plan: "Pengembangan brand identity internasional dan marketing materials",
    action_plan_detailed: [
      "Develop international brand identity dan logo",
      "Create professional product packaging design",
      "Setup company website dengan multiple language",
      "Develop marketing materials dalam bahasa target market",
      "Register trademark di negara target",
      "Create social media presence di platform internasional",
      "Develop brand story dan unique selling proposition"
    ],
    financial_note: "Investment branding dan marketing materials sekitar Rp 200-300 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2026-07-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 13,
    period: "Agustus 2026",
    year: 2026,
    month: 8,
    month_name: "Agustus",
    focus: "Penambahan Volume",
    action_plan: "Peningkatan kapasitas produksi 50% untuk memenuhi demand yang meningkat",
    action_plan_detailed: [
      "Increase production capacity 50% dari current level",
      "Recruit additional production staff",
      "Purchase additional equipment atau machinery",
      "Setup second production shift jika diperlukan",
      "Expand warehouse space untuk handle increased volume",
      "Train existing team untuk handle bigger operation",
      "Setup quality control untuk increased volume"
    ],
    financial_note: "Investment equipment dan expansion sekitar Rp 500-750 juta",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2026-08-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 14,
    period: "September 2026",
    year: 2026,
    month: 9,
    month_name: "September",
    focus: "Kontrol Kualitas",
    action_plan: "Implementasi sistem quality control yang comprehensive",
    action_plan_detailed: [
      "Implement comprehensive QC checklist",
      "Train QC team dengan international standards",
      "Setup inspection procedure untuk setiap batch",
      "Create quality documentation system",
      "Establish return/refund policy untuk quality issues",
      "Regular audit dari third party quality assurance",
      "Customer satisfaction survey untuk quality feedback"
    ],
    financial_note: "Investment QC system dan training sekitar Rp 100-150 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2026-09-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 15,
    period: "Oktober 2026",
    year: 2026,
    month: 10,
    month_name: "Oktober",
    focus: "Diversifikasi Produk",
    action_plan: "Pengembangan varian produk baru berdasarkan market demand",
    action_plan_detailed: [
      "Research demand untuk product variations",
      "Develop 2-3 new product variants",
      "Test market dengan existing buyers",
      "Create production line untuk new variants",
      "Setup separate inventory tracking untuk each variant",
      "Price analysis untuk new products",
      "Marketing strategy untuk product diversification"
    ],
    financial_note: "R&D dan development cost sekitar Rp 200-300 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2026-10-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 16,
    period: "November 2026",
    year: 2026,
    month: 11,
    month_name: "November",
    focus: "Promosi Besar",
    action_plan: "Peluncuran kampanye marketing digital dan promosi besar-besaran",
    action_plan_detailed: [
      "Launch digital marketing campaign di negara target",
      "Setup Google Ads dan social media advertising",
      "Participate di international trade portal",
      "Create promotional video untuk products",
      "Offer seasonal discount atau promotional pricing",
      "Setup referral program untuk existing buyers",
      "Measure ROI dari setiap promotional activity"
    ],
    financial_note: "Budget marketing campaign sekitar Rp 300-500 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2026-11-01",
    phase: "pelaksanaan_ekspor_perdana"
  },
  {
    id: 17,
    period: "Desember 2026",
    year: 2026,
    month: 12,
    month_name: "Desember",
    focus: "Evaluasi Tahunan",
    action_plan: "Review komprehensif operasi 2026 dan perencanaan strategis 2027",
    action_plan_detailed: [
      "Comprehensive review dari seluruh operation 2026",
      "Financial analysis: revenue, profit, cost structure",
      "Customer satisfaction assessment",
      "Team performance evaluation",
      "Market share analysis di setiap negara target",
      "Strategic planning untuk 2027",
      "Set target dan budget untuk tahun berikutnya"
    ],
    financial_note: "Target achievement: Revenue Rp 15-20 miliar, profit margin 20-25%",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2026-12-01",
    phase: "pelaksanaan_ekspor_perdana"
  },

  // FASE 3: EKSPANSI PASAR (Januari 2027 - Desember 2027)
  {
    id: 18,
    period: "Januari 2027",
    year: 2027,
    month: 1,
    month_name: "Januari",
    focus: "Ekspansi Pasar",
    action_plan: "Penelitian dan persiapan masuk pasar baru: India, Bangladesh, Myanmar",
    action_plan_detailed: [
      "Research pasar baru: India, Bangladesh, Myanmar",
      "Analyze regulatory requirement untuk setiap negara baru",
      "Setup compliance untuk new market regulations",
      "Identify local partners atau distributors",
      "Create market entry strategy untuk each new country",
      "Budget allocation untuk market expansion activities",
      "Timeline setup untuk gradual market entry"
    ],
    financial_note: "Investment market research dan expansion planning sekitar Rp 150-200 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2027-01-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 19,
    period: "Februari 2027",
    year: 2027,
    month: 2,
    month_name: "Februari",
    focus: "Cari Buyer Tambahan",
    action_plan: "Generasi leads dan konversi prospect menjadi buyer aktif",
    action_plan_detailed: [
      "Generate leads melalui digital marketing dan trade portals",
      "Attend virtual trade fairs untuk reach broader audience",
      "Setup referral system dari existing satisfied customers",
      "Cold outreach campaign ke 100 potential buyers",
      "Create compelling sales pitch dan presentation materials",
      "Follow up systematically dengan prospect management",
      "Convert leads menjadi qualified prospects"
    ],
    financial_note: "Target 5-8 buyer baru dengan revenue potential Rp 2-3 miliar per bulan",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2027-02-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 20,
    period: "Maret 2027",
    year: 2027,
    month: 3,
    month_name: "Maret",
    focus: "Masuk Pasar Baru",
    action_plan: "Peluncuran produk di pasar baru dengan strategi entry yang tepat",
    action_plan_detailed: [
      "Launch product di 1-2 negara target baru",
      "Setup distribution channel di new markets",
      "Adapt product specifications untuk local requirements",
      "Create localized marketing materials",
      "Setup customer service dalam local language",
      "Monitor market reception dan customer feedback",
      "Adjust strategy berdasarkan initial market response"
    ],
    financial_note: "Investment market entry sekitar Rp 400-600 juta",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2027-03-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 21,
    period: "April 2027",
    year: 2027,
    month: 4,
    month_name: "April",
    focus: "Optimasi Tim Ekspor",
    action_plan: "Perekrutan dan pelatihan tim ekspor yang specialized",
    action_plan_detailed: [
      "Recruit dedicated export manager",
      "Train team untuk handle multiple markets",
      "Setup specialized roles: documentation, customer service, logistics",
      "Implement export management software system",
      "Create standard operating procedures untuk export process",
      "Setup performance metrics untuk export team",
      "Regular training untuk stay updated dengan export regulations"
    ],
    financial_note: "Investment tim dan system sekitar Rp 200-300 juta per tahun",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2027-04-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 22,
    period: "Mei 2027",
    year: 2027,
    month: 5,
    month_name: "Mei",
    focus: "Brand Awareness",
    action_plan: "Pengembangan strategi branding comprehensive untuk pasar internasional",
    action_plan_detailed: [
      "Develop comprehensive branding strategy untuk international markets",
      "Create consistent brand message across all markets",
      "Launch brand awareness campaign di target countries",
      "Setup content marketing strategy: blog, articles, case studies",
      "Develop relationship dengan industry media dan publications",
      "Create brand partnership dengan complementary businesses",
      "Measure brand recognition dalam target markets"
    ],
    financial_note: "Budget branding campaign sekitar Rp 500-750 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2027-05-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 23,
    period: "Juni 2027",
    year: 2027,
    month: 6,
    month_name: "Juni",
    focus: "Evaluasi Target",
    action_plan: "Review dan evaluasi comprehensive terhadap target dan performance",
    action_plan_detailed: [
      "Review performance vs target untuk each market",
      "Analyze sales data dan identify trending patterns",
      "Evaluate ROI dari setiap marketing initiative",
      "Assess customer satisfaction dan loyalty levels",
      "Review operational efficiency dan cost effectiveness",
      "Adjust target dan strategy untuk second half 2027",
      "Plan resource allocation based pada performance evaluation"
    ],
    financial_note: "Performance review budget dan strategic planning sekitar Rp 100-150 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2027-06-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 24,
    period: "Juli 2027",
    year: 2027,
    month: 7,
    month_name: "Juli",
    focus: "Tingkatkan Kapasitas Produksi",
    action_plan: "Peningkatan kapasitas produksi 100% untuk memenuhi demand yang berkembang",
    action_plan_detailed: [
      "Assess current capacity vs projected demand",
      "Plan production capacity expansion 100% dari current level",
      "Research dan purchase additional manufacturing equipment",
      "Expand production facility atau setup second location",
      "Recruit dan train additional production workforce",
      "Setup quality control untuk increased production volume",
      "Plan logistics untuk handle increased output"
    ],
    financial_note: "Investment capacity expansion sekitar Rp 1-1.5 miliar",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2027-07-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 25,
    period: "Agustus 2027",
    year: 2027,
    month: 8,
    month_name: "Agustus",
    focus: "Penambahan Varian Produk",
    action_plan: "Diversifikasi produk dengan 3-5 varian baru berdasarkan market demand",
    action_plan_detailed: [
      "Research market demand untuk specific product variants",
      "Develop 3-5 new product variations berdasarkan customer request",
      "Setup separate production line untuk new variants",
      "Test market acceptance dengan sample distributions",
      "Create marketing strategy untuk each new variant",
      "Setup inventory management untuk multiple product lines",
      "Price positioning untuk new products dalam competitive market"
    ],
    financial_note: "R&D dan setup production line untuk varian baru sekitar Rp 400-600 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2027-08-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 26,
    period: "September 2027",
    year: 2027,
    month: 9,
    month_name: "September",
    focus: "Kontrol Biaya",
    action_plan: "Implementasi program cost control untuk target 15-20% cost reduction",
    action_plan_detailed: [
      "Comprehensive cost analysis across all operations",
      "Identify cost saving opportunities dalam production dan operations",
      "Negotiate better rates dengan suppliers dan service providers",
      "Optimize logistics cost dengan better route planning",
      "Implement cost control measures without compromising quality",
      "Setup monthly cost monitoring dan reporting system",
      "Target 15-20% cost reduction dari operational efficiency"
    ],
    financial_note: "Target cost reduction 15-20% untuk improve profit margin",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2027-09-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 27,
    period: "Oktober 2027",
    year: 2027,
    month: 10,
    month_name: "Oktober",
    focus: "Digital Marketing Besar",
    action_plan: "Launch comprehensive digital marketing campaign dengan target 50% increase inquiries",
    action_plan_detailed: [
      "Launch comprehensive digital marketing campaign",
      "Setup multi-channel approach: social media, search engine, content marketing",
      "Create engaging content: videos, infographics, customer testimonials",
      "Implement SEO strategy untuk increase online visibility",
      "Setup email marketing campaign untuk nurture leads",
      "Measure dan optimize campaign performance regularly",
      "Target 50% increase dalam online inquiries"
    ],
    financial_note: "Budget digital marketing campaign sekitar Rp 600-800 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2027-10-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 28,
    period: "November 2027",
    year: 2027,
    month: 11,
    month_name: "November",
    focus: "Negosiasi Kontrak Jangka Panjang",
    action_plan: "Secure long-term contracts dengan target minimum 60% dari sales",
    action_plan_detailed: [
      "Approach existing satisfied customers untuk long-term contracts",
      "Develop attractive long-term pricing dan incentive structure",
      "Create win-win partnership agreements",
      "Setup volume-based pricing tiers",
      "Negotiate payment terms yang favorable untuk both parties",
      "Include flexibility clauses untuk adapt dengan market changes",
      "Target minimum 60% dari sales melalui long-term contracts"
    ],
    financial_note: "Target 60% sales melalui long-term contracts untuk stable revenue",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2027-11-01",
    phase: "ekspansi_pasar"
  },
  {
    id: 29,
    period: "Desember 2027",
    year: 2027,
    month: 12,
    month_name: "Desember",
    focus: "Evaluasi Tahunan",
    action_plan: "Comprehensive annual review dan strategic planning untuk manufacturing expansion 2028",
    action_plan_detailed: [
      "Comprehensive annual review dari all expansion activities",
      "Financial performance analysis: revenue growth, profitability, market share",
      "Customer portfolio analysis dan satisfaction assessment",
      "Operational efficiency evaluation dan improvement planning",
      "Team performance review dan development planning",
      "Strategic planning untuk 2028 dengan fokus pada manufacturing expansion",
      "Set ambitious target untuk factory establishment project"
    ],
    financial_note: "Target achievement review: Revenue Rp 30-40 miliar, profit margin 25-30%",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2027-12-01",
    phase: "ekspansi_pasar"
  },

  // FASE 4: PEMBANGUNAN PABRIK (Januari 2028 - Desember 2028)
  {
    id: 30,
    period: "Januari 2028",
    year: 2028,
    month: 1,
    month_name: "Januari",
    focus: "Riset Lokasi Pabrik",
    action_plan: "Survey dan evaluasi lokasi strategic untuk pembangunan pabrik",
    action_plan_detailed: [
      "Survey 10-15 potensial lokasi pabrik dalam radius strategic",
      "Evaluate infrastruktur: akses jalan, listrik, air, internet",
      "Analyze proximity ke supplier, port, dan transportation hub",
      "Review local government incentive untuk manufacturing investment",
      "Assess workforce availability dan skill level di area tersebut",
      "Compare cost analysis untuk setiap lokasi potensial",
      "Shortlist 3-5 lokasi terbaik untuk detailed feasibility study"
    ],
    financial_note: "Budget survey dan feasibility study lokasi sekitar Rp 200-300 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2028-01-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 31,
    period: "Februari 2028",
    year: 2028,
    month: 2,
    month_name: "Februari",
    focus: "Cari Investor",
    action_plan: "Mencari dan bernegosiasi dengan investor untuk financing manufacturing expansion",
    action_plan_detailed: [
      "Prepare comprehensive business plan untuk manufacturing expansion",
      "Create financial projections dan ROI analysis",
      "Identify potential investors: private equity, venture capital, angel investors",
      "Prepare pitch deck dan investment presentation materials",
      "Network dengan investment community melalui business events",
      "Setup meetings dengan potential investors dan present business case",
      "Negotiate investment terms yang mutually beneficial"
    ],
    financial_note: "Target funding Rp 5-10 miliar untuk factory development",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2028-02-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 32,
    period: "Maret 2028",
    year: 2028,
    month: 3,
    month_name: "Maret",
    focus: "Studi Kelayakan",
    action_plan: "Pelaksanaan detailed feasibility study untuk manufacturing project",
    action_plan_detailed: [
      "Conduct detailed feasibility study untuk manufacturing project",
      "Financial analysis: investment requirement, cash flow, payback period",
      "Market analysis: demand projection, competition, pricing strategy",
      "Technical analysis: technology requirement, production process, quality standards",
      "Environmental impact assessment dan sustainability planning",
      "Risk analysis dan mitigation strategies",
      "Present feasibility study kepada stakeholders untuk approval"
    ],
    financial_note: "Investment feasibility study sekitar Rp 100-150 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2028-03-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 33,
    period: "April 2028",
    year: 2028,
    month: 4,
    month_name: "April",
    focus: "Pembelian Lahan",
    action_plan: "Finalisasi akuisisi lahan dan penyelesaian legal documentation",
    action_plan_detailed: [
      "Finalize lokasi pabrik berdasarkan feasibility study results",
      "Negotiate land purchase atau lease terms",
      "Due diligence: legal status, zoning compliance, environmental clearance",
      "Secure financing untuk land acquisition",
      "Complete legal documentation dan land transfer process",
      "Obtain necessary permits untuk land use dan construction",
      "Setup project management team untuk oversee construction project"
    ],
    financial_note: "Investment pembelian lahan sekitar Rp 2-3 miliar",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2028-04-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 34,
    period: "Mei 2028",
    year: 2028,
    month: 5,
    month_name: "Mei",
    focus: "Desain Pabrik",
    action_plan: "Pengembangan desain pabrik dan planning layout yang optimal",
    action_plan_detailed: [
      "Hire experienced industrial architect dan engineering consultant",
      "Develop factory layout design yang optimize workflow efficiency",
      "Plan production line configuration untuk maximum productivity",
      "Design quality control areas dan testing facilities",
      "Plan warehouse, office space, dan employee facilities",
      "Ensure compliance dengan safety regulations dan industrial standards",
      "Create detailed construction drawings dan specifications"
    ],
    financial_note: "Cost design dan engineering consultation sekitar Rp 200-300 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2028-05-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 35,
    period: "Juni 2028",
    year: 2028,
    month: 6,
    month_name: "Juni",
    focus: "Pengurusan Izin Pabrik",
    action_plan: "Penyelesaian seluruh perizinan dan regulatory compliance untuk pabrik",
    action_plan_detailed: [
      "Apply untuk building permit dari local government",
      "Obtain environmental clearance dari relevant authorities",
      "Secure industrial operation license",
      "Apply untuk import permit untuk machinery dan equipment",
      "Obtain fire safety clearance dan other safety certifications",
      "Complete all regulatory compliance requirements",
      "Setup timeline untuk permit approval process"
    ],
    financial_note: "Biaya perizinan dan consulting sekitar Rp 150-200 juta",
    status: "caution",
    status_color: "#EF4444",
    sort_date: "2028-06-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 36,
    period: "Juli 2028",
    year: 2028,
    month: 7,
    month_name: "Juli",
    focus: "Negosiasi Supplier Mesin",
    action_plan: "Evaluasi dan negosiasi dengan supplier machinery untuk equipment pabrik",
    action_plan_detailed: [
      "Research dan shortlist machinery suppliers globally",
      "Request quotations dari multiple suppliers untuk comparison",
      "Evaluate technical specifications, warranty, after-sales service",
      "Negotiate pricing, payment terms, dan delivery schedule",
      "Plan machinery installation timeline dengan construction schedule",
      "Arrange training program untuk machine operation",
      "Finalize supplier contracts dengan favorable terms"
    ],
    financial_note: "Investment machinery sekitar Rp 3-5 miliar",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2028-07-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 37,
    period: "Agustus 2028",
    year: 2028,
    month: 8,
    month_name: "Agustus",
    focus: "Persiapan Modal",
    action_plan: "Securing financing dan setup fund management untuk construction project",
    action_plan_detailed: [
      "Secure construction financing dari bank atau investors",
      "Setup project fund management system",
      "Create detailed budget breakdown untuk all project components",
      "Establish contingency fund untuk unexpected expenses",
      "Setup payment schedule align dengan project milestones",
      "Implement financial control system untuk monitor spending",
      "Regular reporting kepada investors dan stakeholders"
    ],
    financial_note: "Total project funding Rp 8-12 miliar dengan contingency 15%",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2028-08-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 38,
    period: "September 2028",
    year: 2028,
    month: 9,
    month_name: "September",
    focus: "Rekrut Tim Awal",
    action_plan: "Perekrutan key positions untuk factory operations dan management",
    action_plan_detailed: [
      "Recruit key positions: plant manager, production supervisor, quality manager",
      "Hire experienced technicians untuk machine operation",
      "Recruit administrative staff untuk factory operations",
      "Setup training program untuk new team members",
      "Develop organizational structure untuk factory operations",
      "Create job descriptions dan performance metrics",
      "Plan compensation package yang competitive dalam industry"
    ],
    financial_note: "Annual payroll cost untuk core team sekitar Rp 1-1.5 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2028-09-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 39,
    period: "Oktober 2028",
    year: 2028,
    month: 10,
    month_name: "Oktober",
    focus: "Pengadaan Mesin",
    action_plan: "Finalisasi purchase orders dan koordinasi delivery machinery",
    action_plan_detailed: [
      "Finalize machinery purchase orders dengan selected suppliers",
      "Coordinate delivery schedule dengan construction timeline",
      "Arrange customs clearance untuk imported machinery",
      "Plan machinery installation sequence",
      "Prepare installation site dengan necessary infrastructure",
      "Coordinate dengan suppliers untuk technical support",
      "Setup machinery maintenance program dari start"
    ],
    financial_note: "Payment schedule machinery sesuai delivery milestones",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2028-10-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 40,
    period: "November 2028",
    year: 2028,
    month: 11,
    month_name: "November",
    focus: "Uji Coba Mesin",
    action_plan: "Installation dan testing machinery untuk ensure operational readiness",
    action_plan_detailed: [
      "Conduct machinery installation dengan supplier technicians",
      "Perform individual machine testing dan calibration",
      "Test production line integration dan workflow",
      "Train operators dengan hands-on machine operation",
      "Conduct safety testing dan compliance verification",
      "Document standard operating procedures untuk each machine",
      "Create maintenance schedule dan spare parts inventory"
    ],
    financial_note: "Installation dan testing cost sekitar Rp 200-300 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2028-11-01",
    phase: "pembangunan_pabrik"
  },
  {
    id: 41,
    period: "Desember 2028",
    year: 2028,
    month: 12,
    month_name: "Desember",
    focus: "Evaluasi Tahunan",
    action_plan: "Comprehensive review construction progress dan preparation untuk operational phase 2029",
    action_plan_detailed: [
      "Review construction project progress terhadap timeline",
      "Evaluate budget performance dan cost control effectiveness",
      "Assess team readiness untuk production launch",
      "Review machinery performance dan readiness",
      "Plan final phase preparation untuk 2029 launch",
      "Setup quality assurance system untuk production",
      "Prepare launch strategy untuk factory operations"
    ],
    financial_note: "Project completion rate 85-90%, ready untuk operational phase",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2028-12-01",
    phase: "pembangunan_pabrik"
  },

  // FASE 5: OPERASIONAL PABRIK (Januari 2029 - Desember 2029)
  {
    id: 42,
    period: "Januari 2029",
    year: 2029,
    month: 1,
    month_name: "Januari",
    focus: "Persiapan Konstruksi",
    action_plan: "Finalisasi persiapan konstruksi dan site preparation untuk operational phase",
    action_plan_detailed: [
      "Complete final construction preparations",
      "Setup construction site safety protocols",
      "Coordinate dengan general contractor untuk construction timeline",
      "Ensure all building materials availability",
      "Setup temporary facilities untuk construction workers",
      "Monitor construction progress weekly dengan detailed reporting",
      "Resolve any construction issues promptly"
    ],
    financial_note: "Final construction budget completion sekitar Rp 1-2 miliar",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2029-01-01",
    phase: "operasional_pabrik"
  },
  {
    id: 43,
    period: "Februari 2029",
    year: 2029,
    month: 2,
    month_name: "Februari",
    focus: "Konstruksi Pabrik Tahap 1",
    action_plan: "Major construction activities untuk foundation dan structure pabrik",
    action_plan_detailed: [
      "Begin major construction activities: foundation, structure",
      "Monitor construction quality dengan regular inspections",
      "Ensure compliance dengan building codes dan safety standards",
      "Coordinate utility connections: electrical, water, gas, internet",
      "Regular progress meetings dengan contractors dan consultants",
      "Manage construction budget dan timeline closely",
      "Address any delays atau cost overruns immediately"
    ],
    financial_note: "Construction phase 1 budget sekitar Rp 2-3 miliar",
    status: "caution",
    status_color: "#EF4444",
    sort_date: "2029-02-01",
    phase: "operasional_pabrik"
  },
  {
    id: 44,
    period: "Maret 2029",
    year: 2029,
    month: 3,
    month_name: "Maret",
    focus: "Konstruksi Tahap 2",
    action_plan: "Penyelesaian building envelope dan sistem utilitas pabrik",
    action_plan_detailed: [
      "Complete building envelope: walls, roof, windows",
      "Install HVAC system untuk climate control",
      "Complete electrical installation untuk machinery",
      "Install plumbing dan water treatment system",
      "Setup security system dan access control",
      "Prepare flooring untuk machinery installation",
      "Final construction quality inspection"
    ],
    financial_note: "Construction phase 2 budget sekitar Rp 1.5-2 miliar",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2029-03-01",
    phase: "operasional_pabrik"
  },
  {
    id: 45,
    period: "April 2029",
    year: 2029,
    month: 4,
    month_name: "April",
    focus: "Instalasi Mesin",
    action_plan: "Installation machinery berdasarkan planned layout dan testing connections",
    action_plan_detailed: [
      "Begin machinery installation berdasarkan planned layout",
      "Coordinate dengan multiple machine suppliers",
      "Test utility connections untuk each machine",
      "Install safety systems dan emergency protocols",
      "Setup production line connectivity",
      "Train technical team pada machine operation",
      "Document installation process untuk future reference"
    ],
    financial_note: "Installation cost dan technical support sekitar Rp 300-500 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2029-04-01",
    phase: "operasional_pabrik"
  },
  {
    id: 46,
    period: "Mei 2029",
    year: 2029,
    month: 5,
    month_name: "Mei",
    focus: "Uji Coba Produksi",
    action_plan: "First production run dan testing product quality dengan existing standards",
    action_plan_detailed: [
      "Conduct first production run dengan limited capacity",
      "Test product quality dengan existing standards",
      "Identify production bottlenecks atau technical issues",
      "Adjust machine settings untuk optimal performance",
      "Test quality control procedures",
      "Evaluate production efficiency dan output rates",
      "Document lessons learned untuk optimization"
    ],
    financial_note: "Trial production cost dan quality testing sekitar Rp 100-200 juta",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2029-05-01",
    phase: "operasional_pabrik"
  },
  {
    id: 47,
    period: "Juni 2029",
    year: 2029,
    month: 6,
    month_name: "Juni",
    focus: "Trial Produksi Skala Kecil",
    action_plan: "Scale up production untuk small batch sizes dan test consistency",
    action_plan_detailed: [
      "Scale up production untuk small batch sizes",
      "Test consistency dalam quality dan output",
      "Evaluate workforce performance dan training needs",
      "Test packaging line integration",
      "Conduct cost analysis untuk actual vs projected costs",
      "Get customer feedback pada factory-produced samples",
      "Prepare untuk larger production volumes"
    ],
    financial_note: "Small scale production cost sekitar Rp 200-300 juta",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2029-06-01",
    phase: "operasional_pabrik"
  },
  {
    id: 48,
    period: "Juli 2029",
    year: 2029,
    month: 7,
    month_name: "Juli",
    focus: "Optimasi Proses",
    action_plan: "Implementation process improvements berdasarkan trial results",
    action_plan_detailed: [
      "Implement process improvements berdasarkan trial results",
      "Optimize workflow untuk maximum efficiency",
      "Fine-tune quality control procedures",
      "Improve machine settings untuk better output",
      "Reduce waste dan improve resource utilization",
      "Setup preventive maintenance procedures",
      "Document standard operating procedures"
    ],
    financial_note: "Process optimization investment sekitar Rp 100-150 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2029-07-01",
    phase: "operasional_pabrik"
  },
  {
    id: 49,
    period: "Agustus 2029",
    year: 2029,
    month: 8,
    month_name: "Agustus",
    focus: "Rekrut Tambahan SDM",
    action_plan: "Hiring additional production workers untuk full capacity operations",
    action_plan_detailed: [
      "Hire additional production workers untuk full capacity",
      "Recruit specialized roles: maintenance, quality control, logistics",
      "Implement comprehensive training program",
      "Setup performance management system",
      "Create career development path untuk employees",
      "Establish employee welfare dan benefits program",
      "Build team culture yang focused pada quality dan efficiency"
    ],
    financial_note: "Additional workforce cost sekitar Rp 500-750 juta per tahun",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2029-08-01",
    phase: "operasional_pabrik"
  },
  {
    id: 50,
    period: "September 2029",
    year: 2029,
    month: 9,
    month_name: "September",
    focus: "Pelatihan Karyawan",
    action_plan: "Intensive training program untuk all employees pada safety dan quality standards",
    action_plan_detailed: [
      "Conduct intensive training program untuk all employees",
      "Focus pada safety procedures dan best practices",
      "Train pada quality standards dan customer requirements",
      "Develop problem-solving skills dalam production team",
      "Cross-training untuk operational flexibility",
      "Regular skills assessment dan certification",
      "Create training documentation dan continuous learning program"
    ],
    financial_note: "Training program cost sekitar Rp 150-200 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2029-09-01",
    phase: "operasional_pabrik"
  },
  {
    id: 51,
    period: "Oktober 2029",
    year: 2029,
    month: 10,
    month_name: "Oktober",
    focus: "Negosiasi Kontrak Besar",
    action_plan: "Approach customers dengan increased capacity offering dan negotiate larger volumes",
    action_plan_detailed: [
      "Approach existing customers dengan increased capacity offering",
      "Negotiate larger volume contracts dengan better pricing",
      "Explore new large customers yang need higher volumes",
      "Create attractive volume-based pricing tiers",
      "Develop long-term supply agreements",
      "Setup contract management system",
      "Target major increase dalam monthly sales volume"
    ],
    financial_note: "Target revenue increase 200-300% dari factory capacity",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2029-10-01",
    phase: "operasional_pabrik"
  },
  {
    id: 52,
    period: "November 2029",
    year: 2029,
    month: 11,
    month_name: "November",
    focus: "Produksi Percobaan",
    action_plan: "Full-scale production trials dan test maximum capacity limits",
    action_plan_detailed: [
      "Run full-scale production trials",
      "Test maximum capacity limits",
      "Evaluate quality consistency pada large volumes",
      "Stress-test all systems dan processes",
      "Monitor equipment performance under full load",
      "Test supply chain capability untuk support higher volumes",
      "Identify areas untuk further optimization"
    ],
    financial_note: "Full-scale trial production cost sekitar Rp 300-500 juta",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2029-11-01",
    phase: "operasional_pabrik"
  },
  {
    id: 53,
    period: "Desember 2029",
    year: 2029,
    month: 12,
    month_name: "Desember",
    focus: "Evaluasi Akhir Pra-Operasi",
    action_plan: "Comprehensive evaluation entire factory readiness untuk 2030 mass production launch",
    action_plan_detailed: [
      "Comprehensive evaluation dari entire factory readiness",
      "Final quality assurance dan safety inspections",
      "Complete regulatory compliance verification",
      "Team readiness assessment untuk full operations",
      "Financial review: actual vs projected investment dan operating costs",
      "Customer readiness assessment untuk increased supply",
      "Final preparation untuk 2030 mass production launch"
    ],
    financial_note: "Factory 95% ready, target full operation January 2030",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2029-12-01",
    phase: "operasional_pabrik"
  },

  // FASE 6: PRODUKSI MASSAL & EKSPANSI GLOBAL (Januari 2030 - Desember 2030)
  {
    id: 54,
    period: "Januari 2030",
    year: 2030,
    month: 1,
    month_name: "Januari",
    focus: "Produksi Massal",
    action_plan: "Launch full-scale production operations dan implement production schedule",
    action_plan_detailed: [
      "Launch full-scale production operations",
      "Implement production schedule untuk meet increased demand",
      "Monitor quality consistency pada mass production levels",
      "Optimize resource utilization untuk cost efficiency",
      "Track production KPIs: output, quality, efficiency, cost",
      "Ensure smooth supply chain operations",
      "Celebrate successful factory launch dengan team dan stakeholders"
    ],
    financial_note: "Target monthly production value Rp 8-12 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2030-01-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 55,
    period: "Februari 2030",
    year: 2030,
    month: 2,
    month_name: "Februari",
    focus: "Pengiriman Rutin Besar",
    action_plan: "Setup large-scale shipping operations dan optimize delivery performance",
    action_plan_detailed: [
      "Setup large-scale shipping operations",
      "Negotiate better shipping rates untuk high volumes",
      "Implement automated inventory management",
      "Setup dedicated logistics team",
      "Monitor delivery performance dan customer satisfaction",
      "Optimize packaging untuk cost dan sustainability",
      "Ensure consistent supply untuk all existing customers"
    ],
    financial_note: "Logistics optimization target 20% cost reduction",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2030-02-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 56,
    period: "Maret 2030",
    year: 2030,
    month: 3,
    month_name: "Maret",
    focus: "Ekspansi Buyer Internasional",
    action_plan: "Target new international markets: Europe, Middle East, Africa",
    action_plan_detailed: [
      "Target new international markets: Europe, Middle East, Africa",
      "Research regulatory requirements untuk new regions",
      "Identify distributors atau partners dalam new markets",
      "Adapt products untuk comply dengan different international standards",
      "Setup international marketing campaigns",
      "Attend international trade fairs untuk broader exposure",
      "Create region-specific sales strategies"
    ],
    financial_note: "International expansion budget sekitar Rp 1-2 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2030-03-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 57,
    period: "April 2030",
    year: 2030,
    month: 4,
    month_name: "April",
    focus: "Peningkatan Kapasitas Produksi",
    action_plan: "Evaluate demand vs current capacity dan plan further expansion",
    action_plan_detailed: [
      "Evaluate demand vs current production capacity",
      "Plan further capacity expansion jika diperlukan",
      "Optimize existing equipment untuk higher output",
      "Consider additional shifts atau production lines",
      "Invest dalam automation untuk increase efficiency",
      "Plan workforce expansion untuk support higher capacity",
      "Monitor capacity utilization dan plan untuk future growth"
    ],
    financial_note: "Capacity expansion investment plan Rp 2-3 miliar",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2030-04-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 58,
    period: "Mei 2030",
    year: 2030,
    month: 5,
    month_name: "Mei",
    focus: "Branding Global",
    action_plan: "Develop global brand strategy dan positioning untuk international markets",
    action_plan_detailed: [
      "Develop global brand strategy dan positioning",
      "Create consistent branding across all international markets",
      "Launch global digital marketing campaigns",
      "Build brand recognition dalam target markets",
      "Develop brand partnerships dengan international companies",
      "Invest dalam brand building activities: sponsorships, events",
      "Measure brand equity dan recognition globally"
    ],
    financial_note: "Global branding campaign budget Rp 800 juta - 1.2 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2030-05-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 59,
    period: "Juni 2030",
    year: 2030,
    month: 6,
    month_name: "Juni",
    focus: "Diversifikasi Produk Besar",
    action_plan: "Launch major product diversification program dan R&D investment",
    action_plan_detailed: [
      "Launch major product diversification program",
      "Develop complementary products untuk existing customer base",
      "Research market demand untuk new product categories",
      "Invest dalam R&D untuk product innovation",
      "Setup separate production lines untuk new products",
      "Create marketing strategy untuk product portfolio",
      "Target significant revenue contribution dari new products"
    ],
    financial_note: "R&D dan diversification investment Rp 1-1.5 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2030-06-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 60,
    period: "Juli 2030",
    year: 2030,
    month: 7,
    month_name: "Juli",
    focus: "Kontrol Kualitas Ketat",
    action_plan: "Implement stringent quality control systems dan automated testing procedures",
    action_plan_detailed: [
      "Implement stringent quality control systems",
      "Setup automated quality testing procedures",
      "Regular third-party quality audits",
      "Customer satisfaction monitoring dan feedback systems",
      "Continuous improvement dalam quality processes",
      "Zero-defect production targeting",
      "Quality certification dari international standards bodies"
    ],
    financial_note: "Quality system investment sekitar Rp 300-500 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2030-07-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 61,
    period: "Agustus 2030",
    year: 2030,
    month: 8,
    month_name: "Agustus",
    focus: "Optimasi Supply Chain Global",
    action_plan: "Setup global supply chain network dan optimize logistics operations",
    action_plan_detailed: [
      "Setup global supply chain network",
      "Negotiate dengan international suppliers",
      "Implement supply chain management software",
      "Optimize logistics untuk global operations",
      "Setup regional distribution centers jika needed",
      "Create supply chain risk management procedures",
      "Focus pada sustainability dalam supply chain"
    ],
    financial_note: "Supply chain optimization budget Rp 500-800 juta",
    status: "mixed",
    status_color: "#F59E0B",
    sort_date: "2030-08-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 62,
    period: "September 2030",
    year: 2030,
    month: 9,
    month_name: "September",
    focus: "Negosiasi Kontrak Multinasional",
    action_plan: "Target large multinational corporations dan develop capability untuk serve global customers",
    action_plan_detailed: [
      "Target large multinational corporations sebagai customers",
      "Develop capability untuk serve global customers",
      "Create competitive advantage proposals",
      "Negotiate long-term supply agreements",
      "Setup global account management",
      "Ensure compliance dengan international business practices",
      "Position company sebagai preferred global supplier"
    ],
    financial_note: "Target multinational contracts value Rp 20-50 miliar annually",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2030-09-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 63,
    period: "Oktober 2030",
    year: 2030,
    month: 10,
    month_name: "Oktober",
    focus: "Promosi Besar Internasional",
    action_plan: "Launch major international promotional campaigns dan build global brand presence",
    action_plan_detailed: [
      "Launch major international promotional campaigns",
      "Participate dalam major international trade exhibitions",
      "Create compelling marketing materials untuk global audience",
      "Leverage digital marketing untuk global reach",
      "Develop promotional partnerships dengan international companies",
      "Measure ROI dari international marketing investments",
      "Build strong brand presence globally"
    ],
    financial_note: "International promotion campaign budget Rp 1-1.5 miliar",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2030-10-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 64,
    period: "November 2030",
    year: 2030,
    month: 11,
    month_name: "November",
    focus: "Penguatan Jaringan Distribusi",
    action_plan: "Expand distribution network internationally dan setup regional distributors",
    action_plan_detailed: [
      "Expand distribution network internationally",
      "Setup regional distributors dalam key markets",
      "Develop distributor support programs",
      "Create competitive distributor incentive programs",
      "Monitor distributor performance dan support",
      "Setup distributor training programs",
      "Ensure consistent service levels across all markets"
    ],
    financial_note: "Distribution network investment Rp 600-800 juta",
    status: "stable",
    status_color: "#3B82F6",
    sort_date: "2030-11-01",
    phase: "produksi_massal_ekspansi_global"
  },
  {
    id: 65,
    period: "Desember 2030",
    year: 2030,
    month: 12,
    month_name: "Desember",
    focus: "Evaluasi Tahunan & Rencana Ekspansi",
    action_plan: "Comprehensive review entire 5-year journey dan strategic planning untuk next expansion phase",
    action_plan_detailed: [
      "Comprehensive review dari entire 5-year journey",
      "Financial analysis: revenue growth, profitability, market position",
      "Market share assessment dalam all target markets",
      "Customer satisfaction dan loyalty evaluation",
      "Team development dan organizational capabilities assessment",
      "Strategic planning untuk further expansion beyond 2030",
      "Set vision untuk next 5-year growth phase sebagai established international manufacturer"
    ],
    financial_note: "Target 2030: Annual revenue Rp 100-150 miliar, profit margin 30-35%",
    status: "positive",
    status_color: "#10B981",
    sort_date: "2030-12-01",
    phase: "produksi_massal_ekspansi_global"
  }
];

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

// Get items by phase
export function getRoadmapItemsByPhase(phase: string): RoadmapItemDetailed[] {
  return COMPREHENSIVE_ROADMAP_DATA.filter(item => item.phase === phase);
}

// Search function
export function searchRoadmapItems(query: string): RoadmapItemDetailed[] {
  const lowercaseQuery = query.toLowerCase();
  return COMPREHENSIVE_ROADMAP_DATA.filter(item => 
    item.focus.toLowerCase().includes(lowercaseQuery) ||
    item.action_plan.toLowerCase().includes(lowercaseQuery) ||
    item.action_plan_detailed.some(action => action.toLowerCase().includes(lowercaseQuery))
  );
}