import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallback (for development)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sriuxykirmjyfmeiiorl.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXV4eWtpcm1qeWZtZWlpb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTA4MTEsImV4cCI6MjA3MDk4NjgxMX0.kqd_G0jGA3gp6HP7q8BHybMMLE1CvDe5mTmknM6Pijk'

// Create Supabase client with auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Types untuk database
export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  role: 'admin' | 'executive' | 'finance';
  avatar_url?: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

// Auth helper functions
export const authHelpers = {
  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  // Get current user profile
  async getCurrentUserProfile(): Promise<Profile | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error getting user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Error signing in:', error.message);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in signIn:', error);
      throw error;
    }
  },

  // Sign up with auto-confirm (no email verification needed)
  async signUp(email: string, password: string, fullName?: string) {
    try {
      // Use auto-confirm signup edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/auto-confirm-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || ''
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error('Auto-confirm signup error:', result.error);
        throw new Error(result.error || 'Terjadi kesalahan saat mendaftar');
      }
      
      console.log('Auto-confirm signup successful:', result.message);
      return {
        user: result.user,
        session: null,
        message: result.message
      };
    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(updates: Partial<Profile>) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },

  // Get all profiles (admin only)
  async getAllProfiles(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all profiles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllProfiles:', error);
      return [];
    }
  }
};

export interface RoadmapItem {
  id: number;
  period: string;
  year: number;
  month: number;
  month_name: string;
  focus: string;
  action_plan: string;
  action_plan_detailed?: string; // JSON string containing detailed action items
  financial_note: string;
  status: 'stable' | 'positive' | 'mixed' | 'caution' | 'neutral';
  status_color: string;
  sort_date: string;
}

export interface FinancialPeriod {
  period_key: string;
  condition: string;
  strategy: string;
  status: string;
  color: string;
}

export interface ActionItemStatus {
  id: number;
  period_id: number;
  action_item_index: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressStats {
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
  yearlyProgress: Record<number, {
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
  }>;
}

// Letter of Credit Management Types
export interface LetterOfCredit {
  id: string;
  lc_number: string;
  issuing_bank?: string;
  advising_bank?: string;
  applicant?: string;
  beneficiary?: string;
  lc_amount?: number;
  lc_currency?: string;
  exchange_rate?: number;
  amount_idr?: number;
  issue_date?: string;
  expiry_date?: string;
  shipment_deadline?: string;
  negotiation_deadline?: string;
  status: 'Draft' | 'Issued' | 'Confirmed' | 'Amended' | 'Utilized' | 'Expired';
  lc_type: 'Sight' | 'Usance' | 'Revolving' | 'Standby';
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface LCAmendment {
  id: string;
  lc_id: string;
  amendment_number: number;
  amendment_date: string;
  changes: string;
  created_at: string;
}

export interface LCDocument {
  id: string;
  lc_id: string;
  document_type: string;
  document_name: string;
  document_url?: string;
  is_required: boolean;
  is_submitted: boolean;
  submission_date?: string;
  created_at: string;
}

// Invoice Management Types
export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: 'Proforma' | 'Commercial' | 'Credit Note' | 'Debit Note';
  lc_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_address?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_business_type?: string;
  invoice_date: string;
  due_date: string;
  payment_terms?: string;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  total_amount_idr: number;
  status: 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
  payment_status: 'Unpaid' | 'Partial' | 'Paid' | 'Refunded';
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  template_id?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  amount: number;
  amount_idr: number;
  hs_code?: string;
  weight?: number;
  dimension?: string;
  unit_of_measure?: string;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_idr: number;
  payment_method: 'Bank Transfer' | 'LC' | 'Cash' | 'Check' | 'Wire Transfer' | 'Other';
  reference_number?: string;
  bank_account?: string;
  received_by?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface InvoiceTemplate {
  id: string;
  template_name: string;
  template_type: 'Proforma' | 'Commercial' | 'Credit Note' | 'Debit Note';
  template_content: any;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

// Payment Terms Management Types
export interface PaymentTermsMaster {
  id: string;
  term_code: string;
  term_name: string;
  term_description?: string;
  term_type: 'DP' | 'COD' | 'NET' | 'LC' | 'CUSTOM';
  days_to_pay: number;
  percentage: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTracking {
  id: string;
  invoice_id: string;
  payment_term_id?: string;
  total_amount: number;
  total_amount_idr: number;
  paid_amount: number;
  paid_amount_idr: number;
  remaining_amount: number;
  remaining_amount_idr: number;
  target_date?: string;
  actual_date?: string;
  status: 'Not Started' | 'Partial' | 'Completed' | 'Overdue';
  overdue_days: number;
  last_payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAlert {
  id: string;
  invoice_id: string;
  payment_tracking_id?: string;
  alert_type: 'UPCOMING' | 'OVERDUE' | 'PARTIAL_FOLLOW_UP';
  alert_date: string;
  due_date: string;
  days_before_due: number;
  days_overdue: number;
  is_sent: boolean;
  is_acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  payment_tracking_id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_idr: number;
  payment_method?: string;
  reference_number?: string;
  bank_account?: string;
  received_by?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

// Phase configuration for roadmap
export const ROADMAP_PHASES = {
  persiapan_dokumen_riset: {
    name: 'Persiapan Dokumen & Riset',
    description: 'Persiapan dokumen ekspor lengkap dan riset pasar mendalam',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    yearRange: [2025, 2025],
    monthRange: [8, 12]
  },
  pelaksanaan_ekspor_perdana: {
    name: 'Pelaksanaan Ekspor Perdana',
    description: 'Negosiasi buyer, pengiriman pertama, dan evaluasi pasar',
    color: '#10B981',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    yearRange: [2026, 2026],
    monthRange: [1, 12]
  },
  ekspansi_pasar: {
    name: 'Ekspansi Pasar',
    description: 'Penambahan buyer, diversifikasi produk, dan optimasi operasional',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    yearRange: [2027, 2027],
    monthRange: [1, 12]
  },
  pembangunan_pabrik: {
    name: 'Pembangunan Pabrik',
    description: 'Riset lokasi, investasi, konstruksi, dan instalasi mesin pabrik',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    yearRange: [2028, 2028],
    monthRange: [1, 12]
  },
  operasional_pabrik: {
    name: 'Operasional Pabrik',
    description: 'Uji coba produksi, pelatihan karyawan, dan optimasi proses',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    yearRange: [2029, 2029],
    monthRange: [1, 12]
  },
  produksi_massal_ekspansi_global: {
    name: 'Produksi Massal & Ekspansi Global',
    description: 'Produksi skala besar, branding global, dan ekspansi internasional',
    color: '#06B6D4',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    yearRange: [2030, 2030],
    monthRange: [1, 12]
  }
} as const;

// Catatan Penting Interface (matching database structure)
export interface CatatanPentingItem {
  id: string;
  title: string;
  description?: string;
  category: 'insight' | 'update' | 'issue' | 'task';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
  related_module?: string;
  related_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Catatan Penting Service for Database Operations
export const catatanPentingService = {
  // Get all catatan penting items
  async getAllCatatanPenting(): Promise<CatatanPentingItem[]> {
    try {
      const { data, error } = await supabase
        .from('catatan_penting')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching catatan penting:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllCatatanPenting:', error);
      return [];
    }
  },

  // Get by priority level
  async getCatatanByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<CatatanPentingItem[]> {
    try {
      const { data, error } = await supabase
        .from('catatan_penting')
        .select('*')
        .eq('priority', priority)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching catatan by priority:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCatatanByPriority:', error);
      return [];
    }
  },

  // Get active (non-resolved) catatan
  async getActiveCatatanPenting(): Promise<CatatanPentingItem[]> {
    try {
      const { data, error } = await supabase
        .from('catatan_penting')
        .select('*')
        .neq('status', 'resolved')
        .neq('status', 'closed')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching active catatan penting:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getActiveCatatanPenting:', error);
      return [];
    }
  },

  // Create new catatan
  async createCatatanPenting(itemData: Omit<CatatanPentingItem, 'id' | 'created_at' | 'updated_at'>): Promise<CatatanPentingItem | null> {
    try {
      const { data, error } = await supabase
        .from('catatan_penting')
        .insert({
          ...itemData,
          category: itemData.category || 'insight', // Default category
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating catatan penting:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createCatatanPenting:', error);
      return null;
    }
  },

  // Update catatan
  async updateCatatanPenting(id: string, updates: Partial<CatatanPentingItem>): Promise<CatatanPentingItem | null> {
    try {
      const { data, error } = await supabase
        .from('catatan_penting')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating catatan penting:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateCatatanPenting:', error);
      return null;
    }
  },

  // Delete catatan
  async deleteCatatanPenting(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('catatan_penting')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting catatan penting:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteCatatanPenting:', error);
      return false;
    }
  }
};

// Status mapping
export const STATUS_CONFIG = {
  positive: {
    label: 'Hijau (Positif)',
    color: '#10B981',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    description: 'Peluang besar'
  },
  stable: {
    label: 'Biru (Stabil)',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Kondisi stabil'
  },
  mixed: {
    label: 'Kuning (Campuran)',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    description: 'Campuran hijau & waspada'
  },
  caution: {
    label: 'Ungu (Waspada)',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    description: 'Periode waspada'
  },
  neutral: {
    label: 'Abu-abu (Netral)',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    description: 'Kondisi netral'
  }
} as const;

// Keuangan Ekspor Interface (matching database structure)
export interface KeuanganEkspor {
  id: string;
  type: 'BUDGET' | 'REALISASI';
  category: 'operasional' | 'marketing' | 'logistik' | 'administrasi' | 'lainnya';
  name: string;
  amount: number;
  original_amount: number;
  currency: string;
  exchange_rate: number;
  amount_idr: number;
  date: string;
  description?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  cash_flow_type: 'cash-in' | 'cash-out';
  month: number;
  year: number;
  lc_number?: string;
  created_at: string;
  updated_at: string;
}

// Keuangan Ekspor Service
export const keuanganEksporService = {
  // Get all keuangan ekspor items
  async getAllKeuanganItems(): Promise<KeuanganEkspor[]> {
    const { data, error } = await supabase
      .from('keuangan_ekspor')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching keuangan ekspor items:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get by type (BUDGET or REALISASI)
  async getKeuanganItemsByType(type: 'BUDGET' | 'REALISASI'): Promise<KeuanganEkspor[]> {
    const { data, error } = await supabase
      .from('keuangan_ekspor')
      .select('*')
      .eq('type', type)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching keuangan items by type:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get by cashflow type
  async getKeuanganItemsByCashflowType(cashFlowType: 'cash-in' | 'cash-out'): Promise<KeuanganEkspor[]> {
    const { data, error } = await supabase
      .from('keuangan_ekspor')
      .select('*')
      .eq('cash_flow_type', cashFlowType)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching keuangan items by cashflow type:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get by period
  async getKeuanganItemsByPeriod(year: number, month?: number): Promise<KeuanganEkspor[]> {
    let query = supabase
      .from('keuangan_ekspor')
      .select('*')
      .eq('year', year);
    
    if (month) {
      query = query.eq('month', month);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching keuangan items by period:', error);
      throw error;
    }
    
    return data || [];
  },

  // Create new keuangan item
  async createKeuanganItem(itemData: Omit<KeuanganEkspor, 'id' | 'created_at' | 'updated_at'>): Promise<KeuanganEkspor> {
    const { data, error } = await supabase
      .from('keuangan_ekspor')
      .insert({
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating keuangan item:', error);
      throw error;
    }
    
    return data;
  },

  // Update keuangan item
  async updateKeuanganItem(id: string, updates: Partial<KeuanganEkspor>): Promise<KeuanganEkspor> {
    const { data, error } = await supabase
      .from('keuangan_ekspor')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating keuangan item:', error);
      throw error;
    }
    
    return data;
  },

  // Delete keuangan item
  async deleteKeuanganItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('keuangan_ekspor')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting keuangan item:', error);
      throw error;
    }
  },

  // Search keuangan items
  async searchKeuanganItems(query: string): Promise<KeuanganEkspor[]> {
    const { data, error } = await supabase
      .from('keuangan_ekspor')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error searching keuangan items:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get analytics data
  async getKeuanganAnalytics(): Promise<{
    totalBudget: number;
    totalRealisasi: number;
    variance: number;
    variancePercentage: number;
    categoryBreakdown: any[];
    cashflowSummary: {
      totalCashIn: number;
      totalCashOut: number;
      netCashflow: number;
    };
    monthlyTrends: any[];
  }> {
    const items = await this.getAllKeuanganItems();
    
    const budgetItems = items.filter(item => item.type === 'BUDGET');
    const realisasiItems = items.filter(item => item.type === 'REALISASI');
    
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount_idr, 0);
    const totalRealisasi = realisasiItems.reduce((sum, item) => sum + item.amount_idr, 0);
    const variance = totalRealisasi - totalBudget;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    
    // Category breakdown
    const categories = ['operasional', 'marketing', 'logistik', 'administrasi', 'lainnya'];
    const categoryBreakdown = categories.map(category => {
      const categoryBudget = budgetItems
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + item.amount_idr, 0);
      const categoryRealisasi = realisasiItems
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + item.amount_idr, 0);
      
      return {
        category,
        budget: categoryBudget,
        realisasi: categoryRealisasi,
        variance: categoryRealisasi - categoryBudget,
        variancePercentage: categoryBudget > 0 ? ((categoryRealisasi - categoryBudget) / categoryBudget) * 100 : 0
      };
    });
    
    // Cashflow summary
    const cashInItems = realisasiItems.filter(item => item.cash_flow_type === 'cash-in');
    const cashOutItems = realisasiItems.filter(item => item.cash_flow_type === 'cash-out');
    
    const totalCashIn = cashInItems.reduce((sum, item) => sum + item.amount_idr, 0);
    const totalCashOut = cashOutItems.reduce((sum, item) => sum + item.amount_idr, 0);
    const netCashflow = totalCashIn - totalCashOut;
    
    // Monthly trends (last 12 months)
    const currentDate = new Date();
    const monthlyTrends = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthItems = items.filter(item => item.year === year && item.month === month);
      const monthBudget = monthItems.filter(item => item.type === 'BUDGET').reduce((sum, item) => sum + item.amount_idr, 0);
      const monthRealisasi = monthItems.filter(item => item.type === 'REALISASI').reduce((sum, item) => sum + item.amount_idr, 0);
      
      monthlyTrends.push({
        year,
        month,
        monthName: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        budget: monthBudget,
        realisasi: monthRealisasi,
        variance: monthRealisasi - monthBudget
      });
    }
    
    return {
      totalBudget,
      totalRealisasi,
      variance,
      variancePercentage,
      categoryBreakdown,
      cashflowSummary: {
        totalCashIn,
        totalCashOut,
        netCashflow
      },
      monthlyTrends
    };
  }
};

// Alert Services for Business Critical Notifications
export const alertsService = {
  // Outstanding Receivables Alert Service
  async getOutstandingReceivablesAlerts(): Promise<Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    remaining_amount_idr: number;
    overdue_days: number;
    target_date: string;
  }>> {
    try {
      // First check if payment_tracking table exists and has data
      const { data: tableCheck, error: tableError } = await supabase
        .from('payment_tracking')
        .select('id')
        .limit(1);
      
      // If table doesn't exist or has error, fallback to invoices table
      if (tableError || !tableCheck) {
        console.warn('⚠️ Payment tracking table not available, using fallback from invoices table');
        return this.getOutstandingReceivablesFromInvoices();
      }
      
      const { data, error } = await supabase
        .from('payment_tracking')
        .select(`
          *,
          invoices!inner (
            invoice_number,
            customer_name,
            payment_status
          )
        `)
        .or('remaining_amount_idr.gt.1000000000,overdue_days.gt.60') // > 1B IDR OR > 60 days
        .neq('invoices.payment_status', 'Paid')
        .order('remaining_amount_idr', { ascending: false });
      
      if (error) {
        console.error('Error fetching outstanding receivables:', error);
        console.warn('⚠️ Falling back to invoices table for receivables data');
        return this.getOutstandingReceivablesFromInvoices();
      }
      
      return (data || []).map(item => ({
        id: item.id,
        invoice_number: item.invoices.invoice_number,
        customer_name: item.invoices.customer_name,
        remaining_amount_idr: item.remaining_amount_idr,
        overdue_days: item.overdue_days || 0,
        target_date: item.target_date || ''
      }));
    } catch (error) {
      console.error('Error in getOutstandingReceivablesAlerts:', error);
      console.warn('⚠️ Falling back to invoices table due to payment_tracking error');
      return this.getOutstandingReceivablesFromInvoices();
    }
  },

  // Fallback method using invoices table only
  async getOutstandingReceivablesFromInvoices(): Promise<Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    remaining_amount_idr: number;
    overdue_days: number;
    target_date: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .neq('payment_status', 'Paid')
        .gt('total_amount_idr', 1000000000) // > 1B IDR
        .order('total_amount_idr', { ascending: false });
      
      if (error) {
        console.error('Error fetching invoices for receivables:', error);
        return [];
      }
      
      const today = new Date();
      return (data || []).map(invoice => {
        const dueDate = new Date(invoice.due_date);
        const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          remaining_amount_idr: invoice.total_amount_idr, // Use total as remaining for fallback
          overdue_days: Math.max(overdueDays, 0),
          target_date: invoice.due_date
        };
      });
    } catch (error) {
      console.error('Error in getOutstandingReceivablesFromInvoices:', error);
      return [];
    }
  },

  // Invoice Overdue Alert Service
  async getOverdueInvoicesAlerts(): Promise<Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    due_date: string;
    total_amount_idr: number;
    overdue_days: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .lt('due_date', new Date().toISOString().split('T')[0]) // due_date < current_date
        .neq('payment_status', 'Paid')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching overdue invoices:', error);
        return [];
      }
      
      const today = new Date();
      return (data || []).map(invoice => {
        const dueDate = new Date(invoice.due_date);
        const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          due_date: invoice.due_date,
          total_amount_idr: invoice.total_amount_idr,
          overdue_days: Math.max(overdueDays, 0)
        };
      }).filter(item => item.overdue_days > 0);
    } catch (error) {
      console.error('Error in getOverdueInvoicesAlerts:', error);
      return [];
    }
  },

  // LC Expiry Alert Service
  async getLCExpiryAlerts(): Promise<Array<{
    id: string;
    lc_number: string;
    expiry_date: string;
    days_to_expiry: number;
    amount_idr: number;
    applicant: string;
  }>> {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await supabase
        .from('letter_of_credits')
        .select('*')
        .gte('expiry_date', new Date().toISOString().split('T')[0]) // expiry_date >= today
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]) // expiry_date <= 30 days from now
        .neq('status', 'Expired')
        .order('expiry_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching LC expiry alerts:', error);
        return [];
      }
      
      const today = new Date();
      return (data || []).map(lc => {
        const expiryDate = new Date(lc.expiry_date);
        const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: lc.id,
          lc_number: lc.lc_number,
          expiry_date: lc.expiry_date,
          days_to_expiry: Math.max(daysToExpiry, 0),
          amount_idr: lc.amount_idr || 0,
          applicant: lc.applicant || ''
        };
      }).filter(item => item.days_to_expiry <= 30);
    } catch (error) {
      console.error('Error in getLCExpiryAlerts:', error);
      return [];
    }
  },

  // Format currency for display
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};

// Database service functions
export const roadmapService = {
  async getAllRoadmapItems(): Promise<RoadmapItem[]> {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .order('sort_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching roadmap items:', error);
      throw error;
    }
    
    return data || [];
  },

  async getRoadmapItemsByYear(year: number): Promise<RoadmapItem[]> {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .eq('year', year)
      .order('month', { ascending: true });
    
    if (error) {
      console.error('Error fetching roadmap items by year:', error);
      throw error;
    }
    
    return data || [];
  },

  async getRoadmapItemsByStatus(status: string): Promise<RoadmapItem[]> {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .eq('status', status)
      .order('sort_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching roadmap items by status:', error);
      throw error;
    }
    
    return data || [];
  },

  async searchRoadmapItems(query: string): Promise<RoadmapItem[]> {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .or(`focus.ilike.%${query}%,action_plan.ilike.%${query}%,financial_note.ilike.%${query}%`)
      .order('sort_date', { ascending: true });
    
    if (error) {
      console.error('Error searching roadmap items:', error);
      throw error;
    }
    
    return data || [];
  },

  async getFinancialPeriods(): Promise<FinancialPeriod[]> {
    const { data, error } = await supabase
      .from('financial_periods')
      .select('*');
    
    if (error) {
      console.error('Error fetching financial periods:', error);
      throw error;
    }
    
    return data || [];
  },

  // Action Item Status Functions
  async getActionItemStatuses(): Promise<ActionItemStatus[]> {
    const { data, error } = await supabase
      .from('action_item_status')
      .select('*')
      .order('period_id', { ascending: true })
      .order('action_item_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching action item statuses:', error);
      throw error;
    }
    
    return data || [];
  },

  async getActionItemStatusesByPeriod(periodId: number): Promise<ActionItemStatus[]> {
    const { data, error } = await supabase
      .from('action_item_status')
      .select('*')
      .eq('period_id', periodId)
      .order('action_item_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching action item statuses by period:', error);
      throw error;
    }
    
    return data || [];
  },

  async updateActionItemStatus(
    periodId: number, 
    actionItemIndex: number, 
    isCompleted: boolean
  ): Promise<ActionItemStatus> {
    const completedAt = isCompleted ? new Date().toISOString() : null;
    
    // Check if record exists
    const { data: existingRecord } = await supabase
      .from('action_item_status')
      .select('*')
      .eq('period_id', periodId)
      .eq('action_item_index', actionItemIndex)
      .maybeSingle();
    
    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabase
        .from('action_item_status')
        .update({
          is_completed: isCompleted,
          completed_at: completedAt,
          updated_at: new Date().toISOString()
        })
        .eq('period_id', periodId)
        .eq('action_item_index', actionItemIndex)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating action item status:', error);
        throw error;
      }
      
      return data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('action_item_status')
        .insert({
          period_id: periodId,
          action_item_index: actionItemIndex,
          is_completed: isCompleted,
          completed_at: completedAt
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting action item status:', error);
        throw error;
      }
      
      return data;
    }
  },

  async calculateProgress(roadmapItems: RoadmapItem[], statuses: ActionItemStatus[]): Promise<ProgressStats> {
    // Use local calculation directly for accurate progress calculation
    console.log('=== USING LOCAL CALCULATION FOR PROGRESS ===');
    console.log('Roadmap items to process:', roadmapItems.length);
    
    return this.calculateProgressLocal(roadmapItems, statuses);
  },

  async calculateProgressLocal(roadmapItems: RoadmapItem[], statuses: ActionItemStatus[]): Promise<ProgressStats> {
    let totalItems = 0;
    let completedItems = 0;
    const yearlyProgress: Record<number, { totalItems: number; completedItems: number; progressPercentage: number }> = {};
    
    // Initialize yearly progress tracking
    roadmapItems.forEach(item => {
      if (!yearlyProgress[item.year]) {
        yearlyProgress[item.year] = { totalItems: 0, completedItems: 0, progressPercentage: 0 };
      }
    });
    
    // Count total items and completed items
    roadmapItems.forEach(item => {
      const actionPlanDetails = parseDetailedActionPlan(item.action_plan_detailed);
      const itemCount = actionPlanDetails.length;
      
      totalItems += itemCount;
      yearlyProgress[item.year].totalItems += itemCount;
      
      // Count completed items for this period
      const periodStatuses = statuses.filter(status => status.period_id === item.id);
      const completedInPeriod = periodStatuses.filter(status => status.is_completed).length;
      
      completedItems += completedInPeriod;
      yearlyProgress[item.year].completedItems += completedInPeriod;
    });
    
    console.log('=== FINAL SUPABASE CALCULATION ===');
    console.log('Total roadmap periods processed:', roadmapItems.length);
    console.log('Total checkboxes found:', totalItems);
    console.log('Total completed checkboxes:', completedItems);
    
    // Calculate percentages
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    // Calculate yearly percentages
    Object.keys(yearlyProgress).forEach(year => {
      const yearData = yearlyProgress[parseInt(year)];
      yearData.progressPercentage = yearData.totalItems > 0 
        ? Math.round((yearData.completedItems / yearData.totalItems) * 100) 
        : 0;
    });
    
    return {
      totalItems,
      completedItems,
      progressPercentage,
      yearlyProgress
    };
  }
};

// Utility functions for phases
export const getPhaseForItem = (item: RoadmapItem): keyof typeof ROADMAP_PHASES | null => {
  const phases = Object.entries(ROADMAP_PHASES);
  
  for (const [phaseKey, phase] of phases) {
    const [startYear, endYear] = phase.yearRange;
    const [startMonth, endMonth] = phase.monthRange;
    
    // Check if item falls within phase range
    // Handle single year phases
    if (startYear === endYear) {
      if (item.year === startYear && item.month >= startMonth && item.month <= endMonth) {
        return phaseKey as keyof typeof ROADMAP_PHASES;
      }
    } else {
      // Handle multi-year phases
      if (
        (item.year === startYear && item.month >= startMonth) ||
        (item.year > startYear && item.year < endYear) ||
        (item.year === endYear && item.month <= endMonth)
      ) {
        return phaseKey as keyof typeof ROADMAP_PHASES;
      }
    }
  }
  
  return null;
};

export const parseDetailedActionPlan = (actionPlanDetailed?: string): string[] => {
  if (!actionPlanDetailed) return [];
  
  try {
    const parsed = JSON.parse(actionPlanDetailed);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing detailed action plan:', error);
    return [];
  }
};

export const getPhaseStats = (items: RoadmapItem[]) => {
  const phaseStats = Object.keys(ROADMAP_PHASES).reduce((acc, phase) => {
    acc[phase] = { count: 0, items: [] as RoadmapItem[] };
    return acc;
  }, {} as Record<string, { count: number; items: RoadmapItem[] }>);
  
  items.forEach(item => {
    const phase = getPhaseForItem(item);
    if (phase && phaseStats[phase]) {
      phaseStats[phase].count++;
      phaseStats[phase].items.push(item);
    }
  });
  
  return phaseStats;
};

// Letter of Credit Management Services
export const lcService = {
  // Get all Letter of Credits
  async getAllLCs(): Promise<LetterOfCredit[]> {
    const { data, error } = await supabase
      .from('letter_of_credits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching LCs:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get LC by ID
  async getLCById(id: string): Promise<LetterOfCredit | null> {
    const { data, error } = await supabase
      .from('letter_of_credits')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching LC by ID:', error);
      throw error;
    }
    
    return data;
  },

  // Create new LC
  async createLC(lcData: Omit<LetterOfCredit, 'id' | 'created_at' | 'updated_at'>): Promise<LetterOfCredit> {
    const { data, error } = await supabase
      .from('letter_of_credits')
      .insert({
        ...lcData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating LC:', error);
      throw error;
    }
    
    return data;
  },

  // Update LC
  async updateLC(id: string, updates: Partial<LetterOfCredit>): Promise<LetterOfCredit> {
    const { data, error } = await supabase
      .from('letter_of_credits')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating LC:', error);
      throw error;
    }
    
    return data;
  },

  // Get LCs by status
  async getLCsByStatus(status: LetterOfCredit['status']): Promise<LetterOfCredit[]> {
    const { data, error } = await supabase
      .from('letter_of_credits')
      .select('*')
      .eq('status', status)
      .order('expiry_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching LCs by status:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get expiring LCs (within next 30 days)
  async getExpiringLCs(): Promise<LetterOfCredit[]> {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const { data, error } = await supabase
      .from('letter_of_credits')
      .select('*')
      .gte('expiry_date', today.toISOString().split('T')[0])  // Not expired yet
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])  // Within 30 days
      .neq('status', 'Expired')
      .order('expiry_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching expiring LCs:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get LC amendments
  async getLCAmendments(lcId: string): Promise<LCAmendment[]> {
    const { data, error } = await supabase
      .from('lc_amendments')
      .select('*')
      .eq('lc_id', lcId)
      .order('amendment_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching LC amendments:', error);
      throw error;
    }
    
    return data || [];
  },

  // Create LC amendment
  async createLCAmendment(amendmentData: Omit<LCAmendment, 'id' | 'created_at'>): Promise<LCAmendment> {
    const { data, error } = await supabase
      .from('lc_amendments')
      .insert({
        ...amendmentData,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating LC amendment:', error);
      throw error;
    }
    
    return data;
  },

  // Update LC amendment
  async updateLCAmendment(id: string, updates: Partial<LCAmendment>): Promise<LCAmendment> {
    const { data, error } = await supabase
      .from('lc_amendments')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating LC amendment:', error);
      throw error;
    }
    
    return data;
  },

  // Delete LC amendment
  async deleteLCAmendment(id: string): Promise<void> {
    const { error } = await supabase
      .from('lc_amendments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting LC amendment:', error);
      throw error;
    }
  },

  // Get LC documents
  async getLCDocuments(lcId: string): Promise<LCDocument[]> {
    const { data, error } = await supabase
      .from('lc_documents')
      .select('*')
      .eq('lc_id', lcId)
      .order('document_type', { ascending: true });
    
    if (error) {
      console.error('Error fetching LC documents:', error);
      throw error;
    }
    
    return data || [];
  },

  // Create LC document
  async createLCDocument(documentData: Omit<LCDocument, 'id' | 'created_at'>): Promise<LCDocument> {
    const { data, error } = await supabase
      .from('lc_documents')
      .insert({
        ...documentData,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating LC document:', error);
      throw error;
    }
    
    return data;
  },

  // Update LC document
  async updateLCDocument(id: string, updates: Partial<LCDocument>): Promise<LCDocument> {
    const { data, error } = await supabase
      .from('lc_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating LC document:', error);
      throw error;
    }
    
    return data;
  },

  // Delete LC document
  async deleteLCDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('lc_documents')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting LC document:', error);
      throw error;
    }
  },

  // Update LC document status
  async updateLCDocumentStatus(id: string, isSubmitted: boolean, submissionDate?: string): Promise<LCDocument> {
    const { data, error } = await supabase
      .from('lc_documents')
      .update({
        is_submitted: isSubmitted,
        submission_date: submissionDate || (isSubmitted ? new Date().toISOString().split('T')[0] : null)
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating LC document status:', error);
      throw error;
    }
    
    return data;
  },

  // Search LCs
  async searchLCs(query: string): Promise<LetterOfCredit[]> {
    const { data, error } = await supabase
      .from('letter_of_credits')
      .select('*')
      .or(`lc_number.ilike.%${query}%,applicant.ilike.%${query}%,beneficiary.ilike.%${query}%,issuing_bank.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching LCs:', error);
      throw error;
    }
    
    return data || [];
  },

  // Delete LC with proper cascading
  async deleteLC(id: string): Promise<void> {
    try {
      // First check if LC exists
      const { data: lcData, error: lcCheckError } = await supabase
        .from('letter_of_credits')
        .select('id, lc_number')
        .eq('id', id)
        .maybeSingle();
      
      if (lcCheckError) {
        console.error('Error checking LC existence:', lcCheckError);
        throw new Error('Gagal memverifikasi LC. Silakan coba lagi.');
      }
      
      if (!lcData) {
        throw new Error('LC tidak ditemukan.');
      }
      
      // Check for related invoices that have payments
      const { data: invoicesWithPayments, error: invoiceCheckError } = await supabase
        .from('invoices')
        .select('id, invoice_number, payment_status')
        .eq('lc_id', id)
        .neq('payment_status', 'Unpaid');
      
      if (invoiceCheckError) {
        console.error('Error checking invoice payments:', invoiceCheckError);
        throw new Error('Gagal memverifikasi status pembayaran invoice. Silakan coba lagi.');
      }
      
      // If there are invoices with payments, prevent deletion
      if (invoicesWithPayments && invoicesWithPayments.length > 0) {
        const invoiceNumbers = invoicesWithPayments.map(inv => inv.invoice_number).join(', ');
        throw new Error(`Tidak dapat menghapus LC karena terdapat invoice dengan pembayaran: ${invoiceNumbers}. Hapus pembayaran terlebih dahulu atau set lc_id menjadi null.`);
      }
      
      // Delete related LC amendments
      const { error: amendmentError } = await supabase
        .from('lc_amendments')
        .delete()
        .eq('lc_id', id);
      
      if (amendmentError) {
        console.error('Error deleting LC amendments:', amendmentError);
        throw new Error('Gagal menghapus amendment LC. Silakan coba lagi.');
      }
      
      // Delete related LC documents
      const { error: documentError } = await supabase
        .from('lc_documents')
        .delete()
        .eq('lc_id', id);
      
      if (documentError) {
        console.error('Error deleting LC documents:', documentError);
        throw new Error('Gagal menghapus dokumen LC. Silakan coba lagi.');
      }
      
      // Set lc_id to null for related invoices (without payments)
      const { error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({ lc_id: null })
        .eq('lc_id', id);
      
      if (invoiceUpdateError) {
        console.error('Error updating invoices lc_id:', invoiceUpdateError);
        throw new Error('Gagal memperbarui referensi invoice. Silakan coba lagi.');
      }
      
      // Finally delete the LC
      const { error: deleteError } = await supabase
        .from('letter_of_credits')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting LC:', deleteError);
        throw new Error('Gagal menghapus LC. Silakan coba lagi.');
      }
      
      console.log(`LC ${lcData.lc_number} berhasil dihapus beserta data terkait.`);
      
    } catch (error) {
      console.error('Error in deleteLC:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Terjadi kesalahan saat menghapus LC. Silakan coba lagi.');
    }
  }
};

// Invoice Management Services
export const invoiceService = {
  // Get all invoices
  async getAllInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get invoice by ID
  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching invoice by ID:', error);
      throw error;
    }
    
    return data;
  },

  // Create new invoice
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
    
    return data;
  },

  // Update invoice
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
    
    return data;
  },

  // Get invoices by status
  async getInvoicesByStatus(status: Invoice['status']): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', status)
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching invoices by status:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get overdue invoices
  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .lt('due_date', today)
      .neq('payment_status', 'Paid')
      .neq('status', 'Cancelled')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get invoices by LC ID
  async getInvoicesByLCId(lcId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('lc_id', lcId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices by LC ID:', error);
      throw error;
    }
    
    return data || [];
  },

  // Search invoices
  async searchInvoices(query: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .or(`invoice_number.ilike.%${query}%,customer_name.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
    
    return data || [];
  },

  // Invoice Items Management
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('line_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching invoice items:', error);
      throw error;
    }
    
    return data || [];
  },

  async createInvoiceItem(itemData: Omit<InvoiceItem, 'id' | 'created_at'>): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from('invoice_items')
      .insert({
        ...itemData,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating invoice item:', error);
      throw error;
    }
    
    return data;
  },

  async updateInvoiceItem(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from('invoice_items')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating invoice item:', error);
      throw error;
    }
    
    return data;
  },

  async deleteInvoiceItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invoice item:', error);
      throw error;
    }
  },

  // Payment Management
  async getInvoicePayments(invoiceId: string): Promise<InvoicePayment[]> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoice payments:', error);
      throw error;
    }
    
    return data || [];
  },

  async createInvoicePayment(paymentData: Omit<InvoicePayment, 'id' | 'created_at'>): Promise<InvoicePayment> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .insert({
        ...paymentData,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating invoice payment:', error);
      throw error;
    }
    
    return data;
  },

  async updateInvoicePayment(id: string, paymentData: Partial<Omit<InvoicePayment, 'id' | 'created_at'>>): Promise<InvoicePayment> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .update(paymentData)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating invoice payment:', error);
      throw error;
    }
    
    return data;
  },

  async deleteInvoicePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invoice payment:', error);
      throw error;
    }
  },

  async getInvoicePaymentById(id: string): Promise<InvoicePayment | null> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching invoice payment by ID:', error);
      throw error;
    }
    
    return data;
  },

  // Analytics and Reports
  async getInvoiceAnalytics(): Promise<{
    totalOutstanding: number;
    totalOverdue: number;
    totalPaid: number;
    averagePaymentDays: number;
    currencyBreakdown: any[];
  }> {
    // This would typically involve more complex queries
    // For now, we'll implement basic analytics
    const invoices = await this.getAllInvoices();
    
    const totalOutstanding = invoices
      .filter(inv => inv.payment_status !== 'Paid')
      .reduce((sum, inv) => sum + inv.total_amount_idr, 0);
    
    const totalOverdue = invoices
      .filter(inv => {
        const today = new Date();
        const dueDate = new Date(inv.due_date);
        return dueDate < today && inv.payment_status !== 'Paid';
      })
      .reduce((sum, inv) => sum + inv.total_amount_idr, 0);
    
    const totalPaid = invoices
      .filter(inv => inv.payment_status === 'Paid')
      .reduce((sum, inv) => sum + inv.total_amount_idr, 0);
    
    // Currency breakdown
    const currencyBreakdown = invoices.reduce((acc, inv) => {
      const existing = acc.find(item => item.currency === inv.currency);
      if (existing) {
        existing.amount += inv.total_amount;
        existing.amount_idr += inv.total_amount_idr;
        existing.count += 1;
      } else {
        acc.push({
          currency: inv.currency,
          amount: inv.total_amount,
          amount_idr: inv.total_amount_idr,
          count: 1
        });
      }
      return acc;
    }, [] as any[]);
    
    return {
      totalOutstanding,
      totalOverdue,
      totalPaid,
      averagePaymentDays: 0, // Would need payment data to calculate
      currencyBreakdown
    };
  },

  // Generate invoice number
  async generateInvoiceNumber(type: Invoice['invoice_type']): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const prefix = {
      'Proforma': 'PI',
      'Commercial': 'CI', 
      'Credit Note': 'CN',
      'Debit Note': 'DN'
    }[type];
    
    // Get last invoice number for this type and year
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('invoice_type', type)
      .like('invoice_number', `${prefix}-${year}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);
    
    let sequenceNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-').pop() || '0');
      sequenceNumber = lastSequence + 1;
    }
    
    return `${prefix}-${year}${month}-${String(sequenceNumber).padStart(4, '0')}`;
  },

  // Delete Invoice with proper cascading
  async deleteInvoice(id: string): Promise<void> {
    try {
      // First check if invoice exists
      const { data: invoiceData, error: invoiceCheckError } = await supabase
        .from('invoices')
        .select('id, invoice_number, payment_status')
        .eq('id', id)
        .maybeSingle();
      
      if (invoiceCheckError) {
        console.error('Error checking invoice existence:', invoiceCheckError);
        throw new Error('Gagal memverifikasi invoice. Silakan coba lagi.');
      }
      
      if (!invoiceData) {
        throw new Error('Invoice tidak ditemukan.');
      }
      
      // Check if invoice has payments
      const { data: payments, error: paymentsCheckError } = await supabase
        .from('invoice_payments')
        .select('id, amount')
        .eq('invoice_id', id);
      
      if (paymentsCheckError) {
        console.error('Error checking invoice payments:', paymentsCheckError);
        throw new Error('Gagal memverifikasi status pembayaran. Silakan coba lagi.');
      }
      
      // If there are payments, prevent deletion
      if (payments && payments.length > 0) {
        throw new Error(`Tidak dapat menghapus invoice karena sudah ada pembayaran. Hapus pembayaran terlebih dahulu atau ubah status invoice.`);
      }
      
      // Check if invoice is paid
      if (invoiceData.payment_status === 'Paid' || invoiceData.payment_status === 'Partial') {
        throw new Error(`Tidak dapat menghapus invoice yang sudah dibayar. Status: ${invoiceData.payment_status}`);
      }
      
      // Delete related invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      if (itemsError) {
        console.error('Error deleting invoice items:', itemsError);
        throw new Error('Gagal menghapus item invoice. Silakan coba lagi.');
      }
      
      // Delete related payment tracking
      const { error: trackingError } = await supabase
        .from('payment_tracking')
        .delete()
        .eq('invoice_id', id);
      
      if (trackingError) {
        console.error('Error deleting payment tracking:', trackingError);
        throw new Error('Gagal menghapus tracking pembayaran. Silakan coba lagi.');
      }
      
      // Delete related payment alerts
      const { error: alertsError } = await supabase
        .from('payment_alerts')
        .delete()
        .eq('invoice_id', id);
      
      if (alertsError) {
        console.error('Error deleting payment alerts:', alertsError);
        throw new Error('Gagal menghapus alert pembayaran. Silakan coba lagi.');
      }
      
      // Finally delete the invoice
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting invoice:', deleteError);
        throw new Error('Gagal menghapus invoice. Silakan coba lagi.');
      }
      
      console.log(`Invoice ${invoiceData.invoice_number} berhasil dihapus beserta data terkait.`);
      
    } catch (error) {
      console.error('Error in deleteInvoice:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Terjadi kesalahan saat menghapus invoice. Silakan coba lagi.');
    }
  }
};

// Payment Terms Management Services
export const paymentTermsService = {
  // Payment Terms Master
  async getAllPaymentTerms(): Promise<PaymentTermsMaster[]> {
    const { data, error } = await supabase
      .from('payment_terms_master')
      .select('*')
      .eq('is_active', true)
      .order('term_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching payment terms:', error);
      throw error;
    }
    
    return data || [];
  },

  async getPaymentTermById(id: string): Promise<PaymentTermsMaster | null> {
    const { data, error } = await supabase
      .from('payment_terms_master')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching payment term by ID:', error);
      throw error;
    }
    
    return data;
  },

  async getPaymentTermByCode(code: string): Promise<PaymentTermsMaster | null> {
    const { data, error } = await supabase
      .from('payment_terms_master')
      .select('*')
      .eq('term_code', code)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching payment term by code:', error);
      throw error;
    }
    
    return data;
  },

  async createPaymentTerm(termData: Omit<PaymentTermsMaster, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentTermsMaster> {
    const { data, error } = await supabase
      .from('payment_terms_master')
      .insert({
        ...termData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating payment term:', error);
      throw error;
    }
    
    return data;
  },

  async updatePaymentTerm(id: string, updates: Partial<PaymentTermsMaster>): Promise<PaymentTermsMaster> {
    const { data, error } = await supabase
      .from('payment_terms_master')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating payment term:', error);
      throw error;
    }
    
    return data;
  },

  // Payment Tracking
  async getAllPaymentTracking(): Promise<PaymentTracking[]> {
    const { data, error } = await supabase
      .from('payment_tracking')
      .select('*')
      .order('target_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching payment tracking:', error);
      throw error;
    }
    
    return data || [];
  },

  async getPaymentTrackingByInvoiceId(invoiceId: string): Promise<PaymentTracking | null> {
    const { data, error } = await supabase
      .from('payment_tracking')
      .select('*')
      .eq('invoice_id', invoiceId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching payment tracking by invoice ID:', error);
      throw error;
    }
    
    return data;
  },

  async createPaymentTracking(trackingData: Omit<PaymentTracking, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentTracking> {
    const { data, error } = await supabase
      .from('payment_tracking')
      .insert({
        ...trackingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating payment tracking:', error);
      throw error;
    }
    
    return data;
  },

  async updatePaymentTracking(id: string, updates: Partial<PaymentTracking>): Promise<PaymentTracking> {
    const { data, error } = await supabase
      .from('payment_tracking')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating payment tracking:', error);
      throw error;
    }
    
    return data;
  },

  async getOverduePayments(): Promise<PaymentTracking[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('payment_tracking')
      .select('*')
      .lt('target_date', today)
      .neq('status', 'Completed')
      .order('target_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching overdue payments:', error);
      throw error;
    }
    
    return data || [];
  },

  async getUpcomingPayments(days: number = 30): Promise<PaymentTracking[]> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    const { data, error } = await supabase
      .from('payment_tracking')
      .select('*')
      .gte('target_date', today.toISOString().split('T')[0])
      .lte('target_date', futureDate.toISOString().split('T')[0])
      .neq('status', 'Completed')
      .order('target_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching upcoming payments:', error);
      throw error;
    }
    
    return data || [];
  },

  // Payment Alerts
  async getActiveAlerts(): Promise<PaymentAlert[]> {
    const { data, error } = await supabase
      .from('payment_alerts')
      .select('*')
      .eq('is_acknowledged', false)
      .order('alert_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
    
    return data || [];
  },

  async createPaymentAlert(alertData: Omit<PaymentAlert, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentAlert> {
    const { data, error } = await supabase
      .from('payment_alerts')
      .insert({
        ...alertData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating payment alert:', error);
      throw error;
    }
    
    return data;
  },

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<PaymentAlert> {
    const { data, error } = await supabase
      .from('payment_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
    
    return data;
  },

  // Payment History
  async getPaymentHistoryByTracking(trackingId: string): Promise<PaymentHistory[]> {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('payment_tracking_id', trackingId)
      .order('payment_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
    
    return data || [];
  },

  async createPaymentHistory(historyData: Omit<PaymentHistory, 'id' | 'created_at'>): Promise<PaymentHistory> {
    const { data, error } = await supabase
      .from('payment_history')
      .insert({
        ...historyData,
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating payment history:', error);
      throw error;
    }
    
    return data;
  },

  // Utility Functions
  async calculateDueDate(invoiceDate: string, paymentTermCode: string): Promise<string> {
    const term = await this.getPaymentTermByCode(paymentTermCode);
    if (!term) {
      throw new Error(`Payment term '${paymentTermCode}' not found`);
    }
    
    const invoice = new Date(invoiceDate);
    const dueDate = new Date(invoice);
    dueDate.setDate(invoice.getDate() + term.days_to_pay);
    
    return dueDate.toISOString().split('T')[0];
  },

  async updatePaymentStatus(trackingId: string): Promise<void> {
    const tracking = await this.getPaymentTrackingById(trackingId);
    if (!tracking) return;
    
    const today = new Date();
    const targetDate = new Date(tracking.target_date || '');
    
    let status: PaymentTracking['status'] = tracking.status;
    let overdueDays = 0;
    
    if (tracking.paid_amount >= tracking.total_amount) {
      status = 'Completed';
    } else if (tracking.paid_amount > 0) {
      status = 'Partial';
    } else if (targetDate < today) {
      status = 'Overdue';
      overdueDays = Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      status = 'Not Started';
    }
    
    await this.updatePaymentTracking(trackingId, {
      status,
      overdue_days: overdueDays
    });
  },

  async getPaymentTrackingById(id: string): Promise<PaymentTracking | null> {
    const { data, error } = await supabase
      .from('payment_tracking')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching payment tracking by ID:', error);
      throw error;
    }
    
    return data;
  },

  // Dashboard Analytics - Integrated with Invoice Data
  async getPaymentTermsAnalytics(): Promise<{
    totalOutstanding: number;
    totalOverdue: number;
    upcomingPayments: number;
    completedPayments: number;
    partialPayments: number;
    overdueCount: number;
    averagePaymentDays: number;
    paymentTermsBreakdown: any[];
  }> {
    try {
      // Get invoice data directly as the primary source
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching invoices for analytics:', error);
        throw error;
      }
      
      const invoiceData = invoices || [];
      const today = new Date();
      
      // Calculate analytics from invoice data
      const totalOutstanding = invoiceData
        .filter(inv => inv.payment_status !== 'Paid')
        .reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      
      const overdueInvoices = invoiceData.filter(inv => {
        if (inv.payment_status === 'Paid') return false;
        const dueDate = new Date(inv.due_date);
        return dueDate < today;
      });
      
      const totalOverdue = overdueInvoices
        .reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      
      const upcomingInvoices = invoiceData.filter(inv => {
        if (inv.payment_status === 'Paid') return false;
        const dueDate = new Date(inv.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 30 && daysDiff >= 0;
      });
      
      const upcomingPayments = upcomingInvoices
        .reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      
      const completedPayments = invoiceData.filter(inv => inv.payment_status === 'Paid').length;
      const partialPayments = invoiceData.filter(inv => inv.payment_status === 'Partial').length;
      const overdueCount = overdueInvoices.length;
      
      // Calculate average payment days for completed invoices
      const paidInvoices = invoiceData.filter(inv => inv.payment_status === 'Paid');
      const averagePaymentDays = paidInvoices.length > 0
        ? paidInvoices.reduce((sum, inv) => {
            const invoiceDate = new Date(inv.invoice_date);
            const dueDate = new Date(inv.due_date);
            // Assuming payment was made on due date for completed invoices
            const paymentDays = Math.ceil((dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + paymentDays;
          }, 0) / paidInvoices.length
        : 0;
      
      // Payment terms breakdown by invoice type and currency
      const paymentTermsBreakdown = invoiceData.reduce((acc, inv) => {
        const key = `${inv.invoice_type}-${inv.currency}`;
        if (!acc[key]) {
          acc[key] = {
            type: inv.invoice_type,
            currency: inv.currency,
            count: 0,
            totalAmount: 0,
            paidAmount: 0,
            outstandingAmount: 0
          };
        }
        acc[key].count++;
        acc[key].totalAmount += inv.total_amount_idr || 0;
        if (inv.payment_status === 'Paid') {
          acc[key].paidAmount += inv.total_amount_idr || 0;
        } else {
          acc[key].outstandingAmount += inv.total_amount_idr || 0;
        }
        return acc;
      }, {} as any);
      
      return {
        totalOutstanding,
        totalOverdue,
        upcomingPayments,
        completedPayments,
        partialPayments,
        overdueCount,
        averagePaymentDays,
        paymentTermsBreakdown: Object.values(paymentTermsBreakdown)
      };
      
    } catch (error) {
      console.error('Error in getPaymentTermsAnalytics:', error);
      
      // Return fallback zeros if analytics fail
      return {
        totalOutstanding: 0,
        totalOverdue: 0,
        upcomingPayments: 0,
        completedPayments: 0,
        partialPayments: 0,
        overdueCount: 0,
        averagePaymentDays: 0,
        paymentTermsBreakdown: []
      };
    }
  },

  // Generate synthetic payment tracking data from invoices
  async getInvoiceBasedPaymentTracking(): Promise<PaymentTracking[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching invoices for tracking:', error);
        throw error;
      }
      
      const invoiceData = invoices || [];
      const today = new Date();
      
      // Convert invoices to payment tracking format
      const trackingData: PaymentTracking[] = invoiceData.map(invoice => {
        const dueDate = new Date(invoice.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: PaymentTracking['status'];
        let overdueDays = 0;
        
        if (invoice.payment_status === 'Paid') {
          status = 'Completed';
        } else if (daysDiff < 0) {
          status = 'Overdue';
          overdueDays = Math.abs(daysDiff);
        } else if (invoice.payment_status === 'Partial') {
          status = 'Partial';
        } else {
          status = 'Not Started';
        }
        
        const remainingAmount = invoice.payment_status === 'Paid' ? 0 : (invoice.total_amount_idr || 0);
        const paidAmount = invoice.payment_status === 'Paid' ? (invoice.total_amount_idr || 0) : 
                          invoice.payment_status === 'Partial' ? (invoice.total_amount_idr || 0) * 0.3 : 0; // Assume 30% paid for partial
        
        return {
          id: `synthetic-${invoice.id}`,
          invoice_id: invoice.id,
          payment_term_id: null,
          total_amount: invoice.total_amount_idr || 0,
          total_amount_idr: invoice.total_amount_idr || 0,
          paid_amount: paidAmount,
          paid_amount_idr: paidAmount,
          remaining_amount: remainingAmount,
          remaining_amount_idr: remainingAmount,
          target_date: invoice.due_date,
          actual_date: invoice.payment_status === 'Paid' ? invoice.due_date : null,
          status,
          overdue_days: overdueDays,
          last_payment_date: invoice.payment_status === 'Paid' ? invoice.due_date : null,
          notes: `Generated from invoice ${invoice.invoice_number}`,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at || invoice.created_at
        };
      });
      
      return trackingData;
      
    } catch (error) {
      console.error('Error generating invoice-based tracking:', error);
      return [];
    }
  }
};

// Executive Dashboard Analytics Service
// This service aggregates data from all source modules to ensure consistency
export const dashboardAnalyticsService = {
  // Main dashboard data aggregation
  async getDashboardData(dateRange: string = '30', startDate?: string, endDate?: string): Promise<{
    revenue: {
      current: number;
      previous: number;
      growth: number;
      avgOrderValue: number;
      byCurrency: Record<string, any>;
      monthlyTrends: Array<{month: string; revenue: number; count: number}>;
    };
    cashFlow: {
      outstandingReceivables: number;
      paymentCollectionRate: number;
      avgPaymentDays: number;
      paidAmount: number;
    };
    operations: {
      activeLCs: number;
      expiringLCs: number;
      invoiceAging: Record<string, number>;
      totalInvoices: number;
    };
    customers: {
      topCustomers: Array<{name: string; revenue: number; count: number}>;
      geoRevenue: Record<string, number>;
      newCustomers: number;
      returningCustomers: number;
    };
    summary: {
      totalRevenue: number;
      totalLCs: number;
      totalInvoices: number;
      totalPayments: number;
      period: string;
    };
  }> {
    try {
      // Input validation for custom date range with enhanced error handling
      if (dateRange === 'custom') {
        if (!startDate || !endDate) {
          throw new Error('custom: Start date and end date are required for custom range');
        }
        
        // More robust date parsing with explicit timezone handling
        let startDateTime: Date, endDateTime: Date;
        
        try {
          // Add time component to ensure consistent parsing
          startDateTime = new Date(startDate + 'T00:00:00.000Z');
          endDateTime = new Date(endDate + 'T23:59:59.999Z');
        } catch (parseError) {
          throw new Error('custom: Invalid date format provided - expected YYYY-MM-DD format');
        }
        
        // Validate parsed dates
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          throw new Error('custom: Invalid date format provided - failed to parse dates');
        }
        
        if (startDateTime > endDateTime) {
          throw new Error('custom: Start date must be before or equal to end date');
        }
        
        // Additional validation for future dates - FIXED LOGIC
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        
        // Allow today as end date, only reject future dates
        if (endDateTime > today) {
          throw new Error('custom: End date cannot be in the future');
        }
        
        // Validate reasonable date range (not more than 5 years back)
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        if (startDateTime < fiveYearsAgo) {
          throw new Error('custom: Start date cannot be more than 5 years in the past');
        }
      }
      
      // Calculate date filters with improved error handling
      const endDateFilter = endDate || new Date().toISOString().split('T')[0];
      let startDateFilter = startDate;
      
      if (!startDateFilter) {
        const days = parseInt(dateRange);
        if (isNaN(days) || days <= 0 || days > 365) {
          throw new Error('Invalid date range provided - must be between 1 and 365 days');
        }
        const start = new Date();
        start.setDate(start.getDate() - days);
        startDateFilter = start.toISOString().split('T')[0];
      }
      
      // Validate final date filter format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateFilter) || !/^\d{4}-\d{2}-\d{2}$/.test(endDateFilter)) {
        throw new Error('Invalid date format in filters - expected YYYY-MM-DD');
      }
      
      // Get data from all source modules
      const [invoices, lcs, keuanganItems, paymentAnalytics] = await Promise.all([
        invoiceService.getAllInvoices(),
        lcService.getAllLCs(),
        keuanganEksporService.getAllKeuanganItems(),
        paymentTermsService.getPaymentTermsAnalytics()
      ]);
      
      // Filter data by date range
      const filteredInvoices = invoices.filter(inv => {
        const invoiceDate = inv.invoice_date || inv.created_at.split('T')[0];
        return invoiceDate >= startDateFilter && invoiceDate <= endDateFilter;
      });
      
      const filteredKeuangan = keuanganItems.filter(item => {
        return item.date >= startDateFilter && item.date <= endDateFilter;
      });
      
      // Calculate previous period for comparison with safe date handling
      let periodDays: number;
      try {
        periodDays = dateRange === 'custom' 
          ? Math.ceil((new Date(endDateFilter).getTime() - new Date(startDateFilter).getTime()) / (1000 * 60 * 60 * 24))
          : parseInt(dateRange);
      } catch (error) {
        periodDays = 30; // fallback to 30 days
      }
      
      const previousStart = new Date(startDateFilter);
      previousStart.setDate(previousStart.getDate() - periodDays);
      const previousEnd = new Date(startDateFilter);
      previousEnd.setDate(previousEnd.getDate() - 1);
      
      const previousInvoices = invoices.filter(inv => {
        const invoiceDate = inv.invoice_date || inv.created_at.split('T')[0];
        return invoiceDate >= previousStart.toISOString().split('T')[0] && 
               invoiceDate <= previousEnd.toISOString().split('T')[0];
      });
      
      // Revenue calculations
      const currentRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      const previousRevenue = previousInvoices.reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const avgOrderValue = filteredInvoices.length > 0 ? currentRevenue / filteredInvoices.length : 0;
      
      // Currency breakdown
      const byCurrency = filteredInvoices.reduce((acc, inv) => {
        if (!acc[inv.currency]) {
          acc[inv.currency] = { amount: 0, count: 0, amount_idr: 0 };
        }
        acc[inv.currency].amount += inv.total_amount || 0;
        acc[inv.currency].amount_idr += inv.total_amount_idr || 0;
        acc[inv.currency].count += 1;
        return acc;
      }, {} as Record<string, any>);
      
      // Monthly trends (last 12 months)
      const monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const monthInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.invoice_date || inv.created_at);
          return invDate.getFullYear() === date.getFullYear() && 
                 invDate.getMonth() === date.getMonth();
        });
        
        monthlyTrends.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          revenue: monthInvoices.reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0),
          count: monthInvoices.length
        });
      }
      
      // Cash flow calculations
      const outstandingReceivables = paymentAnalytics.totalOutstanding;
      const paidAmount = invoices
        .filter(inv => inv.payment_status === 'Paid')
        .reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      const paymentCollectionRate = totalInvoiceAmount > 0 ? (paidAmount / totalInvoiceAmount) * 100 : 0;
      const avgPaymentDays = paymentAnalytics.averagePaymentDays;
      
      // Operations data
      const activeLCs = lcs.filter(lc => 
        lc.status === 'Issued' || lc.status === 'Confirmed' || lc.status === 'Amended'
      ).length;
      
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      const expiringLCs = lcs.filter(lc => {
        if (!lc.expiry_date || lc.status === 'Expired') return false;
        const expiryDate = new Date(lc.expiry_date);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      }).length;
      
      // Invoice aging analysis
      const invoiceAging = {
        'current': 0,
        '1-30': 0,
        '31-60': 0,
        '61-90': 0,
        '90+': 0
      };
      
      invoices.filter(inv => inv.payment_status !== 'Paid').forEach(inv => {
        const dueDate = new Date(inv.due_date);
        const daysDiff = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = inv.total_amount_idr || 0;
        
        if (daysDiff <= 0) {
          invoiceAging.current += amount;
        } else if (daysDiff <= 30) {
          invoiceAging['1-30'] += amount;
        } else if (daysDiff <= 60) {
          invoiceAging['31-60'] += amount;
        } else if (daysDiff <= 90) {
          invoiceAging['61-90'] += amount;
        } else {
          invoiceAging['90+'] += amount;
        }
      });
      
      // Customer analysis
      const customerRevenue = filteredInvoices.reduce((acc, inv) => {
        if (!acc[inv.customer_name]) {
          acc[inv.customer_name] = { revenue: 0, count: 0 };
        }
        acc[inv.customer_name].revenue += inv.total_amount_idr || 0;
        acc[inv.customer_name].count += 1;
        return acc;
      }, {} as Record<string, { revenue: number; count: number }>);
      
      const topCustomers = Object.entries(customerRevenue)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Geographic revenue (simplified - using customer name as proxy)
      const geoRevenue = Object.entries(customerRevenue).reduce((acc, [name, data]) => {
        const region = this.getRegionFromCustomerName(name);
        if (!acc[region]) acc[region] = 0;
        acc[region] += data.revenue;
        return acc;
      }, {} as Record<string, number>);
      
      // Customer acquisition (new vs returning)
      const existingCustomers = new Set(
        invoices.filter(inv => inv.invoice_date < startDateFilter)
          .map(inv => inv.customer_name)
      );
      const currentCustomers = new Set(filteredInvoices.map(inv => inv.customer_name));
      const newCustomers = Array.from(currentCustomers).filter(name => !existingCustomers.has(name)).length;
      const returningCustomers = Array.from(currentCustomers).filter(name => existingCustomers.has(name)).length;
      
      // Summary calculations
      const totalRevenue = filteredKeuangan
        .filter(item => item.cash_flow_type === 'cash-in')
        .reduce((sum, item) => sum + item.amount_idr, 0);
      
      const totalLCs = lcs.length;
      const totalInvoices = filteredInvoices.length;
      const totalPayments = invoices.filter(inv => inv.payment_status === 'Paid').length;
      
      const periodLabel = dateRange === 'custom' && startDate && endDate 
        ? `${startDate} - ${endDate}`
        : `${dateRange} hari terakhir`;
      
      return {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth,
          avgOrderValue,
          byCurrency,
          monthlyTrends
        },
        cashFlow: {
          outstandingReceivables,
          paymentCollectionRate,
          avgPaymentDays,
          paidAmount
        },
        operations: {
          activeLCs,
          expiringLCs,
          invoiceAging,
          totalInvoices: invoices.length
        },
        customers: {
          topCustomers,
          geoRevenue,
          newCustomers,
          returningCustomers
        },
        summary: {
          totalRevenue: currentRevenue,
          totalLCs,
          totalInvoices,
          totalPayments,
          period: periodLabel
        }
      };
      
    } catch (error: any) {
      console.error('Error in getDashboardData:', error);
      
      // Provide fallback data structure to prevent complete dashboard failure
      if (error.message?.includes('custom')) {
        // Re-throw custom date validation errors
        throw error;
      }
      
      // For other errors, provide minimal fallback data
      const fallbackPeriod = dateRange === 'custom' && startDate && endDate 
        ? `${startDate} - ${endDate}` 
        : `${dateRange} hari terakhir (fallback)`;
      
      const fallbackData = {
        revenue: {
          current: 0,
          previous: 0,
          growth: 0,
          avgOrderValue: 0,
          byCurrency: {},
          monthlyTrends: []
        },
        cashFlow: {
          outstandingReceivables: 0,
          paymentCollectionRate: 0,
          avgPaymentDays: 0,
          paidAmount: 0
        },
        operations: {
          activeLCs: 0,
          expiringLCs: 0,
          invoiceAging: {
            'current': 0,
            '1-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
          },
          totalInvoices: 0
        },
        customers: {
          topCustomers: [],
          geoRevenue: {},
          newCustomers: 0,
          returningCustomers: 0
        },
        summary: {
          totalRevenue: 0,
          totalLCs: 0,
          totalInvoices: 0,
          totalPayments: 0,
          period: fallbackPeriod
        }
      };
      
      // Only use fallback for non-critical errors
      if (error.code === 'PGRST116' || error.message?.includes('database')) {
        console.warn('Using fallback data due to database connectivity issues');
        return fallbackData;
      }
      
      // Re-throw other errors
      throw error;
    }
  },
  
  // Real-time alerts aggregation with REAL data from Catatan Penting database
  async getRealTimeAlerts(): Promise<{
    alerts: Array<{
      id: string;
      type: string;
      severity: 'critical' | 'warning' | 'info';
      title: string;
      message: string;
      data: any;
      created_at: string;
      action_required: boolean;
      action_url: string;
      priority: 'critical' | 'high' | 'medium';
      category: string;
    }>;
    summary: {
      total: number;
      critical: number;
      warning: number;
      info: number;
      actionRequired: number;
    };
    last_updated: string;
  }> {
    try {
      // Get REAL data from Catatan Penting database
      let catatanPenting: CatatanPentingItem[] = [];
      try {
        catatanPenting = await catatanPentingService.getActiveCatatanPenting();
        console.log(`Loaded ${catatanPenting.length} catatan penting from database`);
      } catch (error) {
        console.warn('CatatanPentingService error, notifications will only show LC/Invoice alerts:', error);
        catatanPenting = [];
      }
      
      const [lcs, invoices, paymentAlerts] = await Promise.all([
        lcService.getAllLCs(),
        invoiceService.getAllInvoices(),
        paymentTermsService.getActiveAlerts()
      ]);
      
      const alerts = [];
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      // REAL Catatan Penting alerts - ONLY if data exists in database
      if (catatanPenting.length > 0) {
        const criticalNotes = catatanPenting.filter(note => 
          note.priority === 'critical' && note.status !== 'resolved' && note.status !== 'closed'
        );
        
        criticalNotes.forEach(note => {
          alerts.push({
            id: `catatan-critical-${note.id}`,
            type: 'CRITICAL_NOTE',
            severity: 'critical' as 'critical',
            title: note.title,
            message: note.description || note.title,
            data: { catatan_id: note.id, category: note.category, priority: note.priority },
            created_at: note.created_at,
            action_required: true,
            action_url: `/catatan-penting?id=${note.id}`,
            priority: 'critical' as 'critical',
            category: 'Catatan Penting'
          });
        });
        
        const highNotes = catatanPenting.filter(note => 
          note.priority === 'high' && note.status !== 'resolved' && note.status !== 'closed'
        );
        
        highNotes.forEach(note => {
          alerts.push({
            id: `catatan-high-${note.id}`,
            type: 'HIGH_PRIORITY_NOTE',
            severity: 'warning' as 'warning',
            title: note.title,
            message: note.description || note.title,
            data: { catatan_id: note.id, category: note.category, priority: note.priority },
            created_at: note.created_at,
            action_required: true,
            action_url: `/catatan-penting?id=${note.id}`,
            priority: 'high' as 'high',
            category: 'Catatan Penting'
          });
        });
        
        const mediumNotes = catatanPenting.filter(note => 
          note.priority === 'medium' && note.status !== 'resolved' && note.status !== 'closed'
        );
        
        mediumNotes.slice(0, 2).forEach(note => { // Limit medium priority to 2 items
          alerts.push({
            id: `catatan-medium-${note.id}`,
            type: 'MEDIUM_PRIORITY_NOTE',
            severity: 'info' as 'info',
            title: note.title,
            message: note.description || note.title,
            data: { catatan_id: note.id, category: note.category, priority: note.priority },
            created_at: note.created_at,
            action_required: false,
            action_url: `/catatan-penting?id=${note.id}`,
            priority: 'medium' as 'medium',
            category: 'Catatan Penting'
          });
        });
      }
      
      // LC expiring alerts - CRITICAL if < 7 days, HIGH if < 30 days
      const expiringLCs = lcs.filter(lc => {
        if (!lc.expiry_date || lc.status === 'Expired') return false;
        const expiryDate = new Date(lc.expiry_date);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      });
      
      expiringLCs.forEach(lc => {
        const expiryDate = new Date(lc.expiry_date!);
        const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        alerts.push({
          id: `lc-expiry-${lc.id}`,
          type: 'LC_EXPIRY',
          severity: daysToExpiry <= 7 ? 'critical' : 'warning' as 'critical' | 'warning',
          title: `LC ${lc.lc_number} Akan Expired`,
          message: `Akan expired dalam ${daysToExpiry} hari`,
          data: { lc_id: lc.id, lc_number: lc.lc_number, expiry_date: lc.expiry_date },
          created_at: new Date().toISOString(),
          action_required: true,
          action_url: `/lc-management?id=${lc.id}`,
          priority: daysToExpiry <= 7 ? 'critical' : 'high' as 'critical' | 'high',
          category: 'Letter of Credit'
        });
      });
      
      // Overdue invoice alerts - priority based on overdue days
      const overdueInvoices = invoices.filter(inv => {
        if (inv.payment_status === 'Paid') return false;
        const dueDate = new Date(inv.due_date);
        return dueDate < today;
      });
      
      overdueInvoices.slice(0, 5).forEach(inv => { // Limit to 5 overdue invoices
        const dueDate = new Date(inv.due_date);
        const overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: 'critical' | 'high' | 'medium';
        let severity: 'critical' | 'warning';
        
        if (overdueDays > 60) {
          priority = 'critical';
          severity = 'critical';
        } else if (overdueDays > 30) {
          priority = 'high';
          severity = 'critical';
        } else {
          priority = 'high';
          severity = 'warning';
        }
        
        alerts.push({
          id: `invoice-overdue-${inv.id}`,
          type: 'INVOICE_OVERDUE',
          severity: severity,
          title: `Invoice ${inv.invoice_number} Overdue`,
          message: `Overdue ${overdueDays} hari (${this.formatCurrency(inv.total_amount_idr || 0)})`,
          data: { invoice_id: inv.id, invoice_number: inv.invoice_number, overdue_days: overdueDays },
          created_at: new Date().toISOString(),
          action_required: true,
          action_url: `/invoice-management?id=${inv.id}`,
          priority: priority,
          category: 'Invoice Management'
        });
      });
      
      // Cash flow alerts for significant amounts
      const totalOutstanding = invoices
        .filter(inv => inv.payment_status !== 'Paid')
        .reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      
      if (totalOutstanding > 5000000000) { // 5 billion IDR threshold
        alerts.push({
          id: 'cash-flow-critical',
          type: 'CASH_FLOW_CRITICAL',
          severity: 'critical',
          title: 'Outstanding Receivables Tinggi',
          message: this.formatCurrency(totalOutstanding),
          data: { amount: totalOutstanding },
          created_at: new Date().toISOString(),
          action_required: true,
          action_url: '/payment-terms',
          priority: 'critical',
          category: 'Cash Flow'
        });
      }
      
      // Sort alerts by priority first, then creation time
      alerts.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2 };
        const priorityA = priorityOrder[a.priority] || 1;
        const priorityB = priorityOrder[b.priority] || 1;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Calculate summary
      const summary = alerts.reduce((acc, alert) => {
        acc.total++;
        acc[alert.severity]++;
        if (alert.action_required) acc.actionRequired++;
        return acc;
      }, {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0,
        actionRequired: 0
      });
      
      return {
        alerts,
        summary,
        last_updated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error in getRealTimeAlerts:', error);
      // Return empty alerts on error instead of throwing
      return {
        alerts: [],
        summary: {
          total: 0,
          critical: 0,
          warning: 0,
          info: 0,
          actionRequired: 0
        },
        last_updated: new Date().toISOString()
      };
    }
  },
  
  // Chart data generation
  async getChartData(chartType: string, dateRange: string = '30', groupBy: string = 'month', startDate?: string, endDate?: string): Promise<{
    chart_data: {
      type: string;
      data: any[];
      labels: string[];
      datasets: any[];
    };
    chart_type: string;
    period: string;
    filters: any;
    generated_at: string;
  }> {
    try {
      const endDateFilter = endDate || new Date().toISOString().split('T')[0];
      let startDateFilter = startDate;
      
      if (!startDateFilter) {
        const days = parseInt(dateRange);
        const start = new Date();
        start.setDate(start.getDate() - days);
        startDateFilter = start.toISOString().split('T')[0];
      }
      
      let chartData: any;
      
      switch (chartType) {
        case 'revenue_trend':
          chartData = await this.generateRevenueTrendChart(startDateFilter, endDateFilter, groupBy);
          break;
        case 'top_customers':
          chartData = await this.generateTopCustomersChart(startDateFilter, endDateFilter);
          break;
        case 'cash_flow_projection':
          chartData = await this.generateCashFlowChart(startDateFilter, endDateFilter);
          break;
        case 'lc_status_distribution':
          chartData = await this.generateLCStatusChart();
          break;
        case 'invoice_aging':
          chartData = await this.generateInvoiceAgingChart();
          break;
        case 'revenue_by_currency':
          chartData = await this.generateCurrencyChart(startDateFilter, endDateFilter);
          break;
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }
      
      const periodLabel = dateRange === 'custom' && startDate && endDate 
        ? `${startDate} - ${endDate}`
        : `${dateRange} hari terakhir`;
      
      return {
        chart_data: chartData,
        chart_type: chartType,
        period: periodLabel,
        filters: { dateRange, groupBy, startDate, endDate },
        generated_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error in getChartData:', error);
      throw error;
    }
  },
  
  // Helper methods for chart generation
  async generateRevenueTrendChart(startDate: string, endDate: string, groupBy: string): Promise<any> {
    const invoices = await invoiceService.getAllInvoices();
    const filteredInvoices = invoices.filter(inv => {
      const invoiceDate = inv.invoice_date || inv.created_at.split('T')[0];
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
    
    const groupedData = this.groupDataByPeriod(filteredInvoices, groupBy, 'invoice_date');
    
    const labels = Object.keys(groupedData).sort();
    const revenueData = labels.map(label => 
      groupedData[label].reduce((sum: number, inv: any) => sum + (inv.total_amount_idr || 0), 0)
    );
    
    // Calculate revenue growth rate for each time period
    const growthRateData = revenueData.map((currentRevenue, index) => {
      if (index === 0) return 0; // First period has no previous data for comparison
      
      const previousRevenue = revenueData[index - 1];
      
      // Handle division by zero - if previous revenue is 0, return 0 or handle as new business
      if (previousRevenue === 0) {
        return currentRevenue > 0 ? 100 : 0; // 100% growth from zero base
      }
      
      // Calculate month-over-month growth rate as percentage
      return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    });
    
    return {
      type: 'line',
      labels: labels.map(label => this.formatPeriodLabel(label, groupBy)),
      datasets: [
        {
          label: 'Revenue (IDR)',
          data: revenueData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Revenue Growth Rate (%)',
          data: growthRateData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    };
  },
  
  async generateTopCustomersChart(startDate: string, endDate: string): Promise<any> {
    const invoices = await invoiceService.getAllInvoices();
    const filteredInvoices = invoices.filter(inv => {
      const invoiceDate = inv.invoice_date || inv.created_at.split('T')[0];
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
    
    const customerData = filteredInvoices.reduce((acc, inv) => {
      if (!acc[inv.customer_name]) {
        acc[inv.customer_name] = 0;
      }
      acc[inv.customer_name] += inv.total_amount_idr || 0;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedCustomers = Object.entries(customerData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    return {
      type: 'bar',
      labels: sortedCustomers.map(([name]) => name),
      datasets: [{
        label: 'Revenue (IDR)',
        data: sortedCustomers.map(([,amount]) => amount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ]
      }]
    };
  },
  
  async generateCashFlowChart(startDate: string, endDate: string): Promise<any> {
    const invoices = await invoiceService.getAllInvoices();
    const keuanganItems = await keuanganEksporService.getAllKeuanganItems();
    
    // Generate next 90 days projection
    const today = new Date();
    const projectionData = [];
    
    for (let i = 0; i < 90; i += 7) { // Weekly intervals
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekLabel = weekStart.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      
      // Calculate expected cash in (invoices due)
      const cashIn = invoices
        .filter(inv => {
          if (inv.payment_status === 'Paid') return false;
          const dueDate = new Date(inv.due_date);
          return dueDate >= weekStart && dueDate <= weekEnd;
        })
        .reduce((sum, inv) => sum + (inv.total_amount_idr || 0), 0);
      
      // Calculate expected cash out (planned expenses)
      const cashOut = keuanganItems
        .filter(item => {
          if (item.cash_flow_type !== 'cash-out' || item.status === 'cancelled') return false;
          const itemDate = new Date(item.date);
          return itemDate >= weekStart && itemDate <= weekEnd;
        })
        .reduce((sum, item) => sum + item.amount_idr, 0);
      
      projectionData.push({
        week: weekLabel,
        cashIn,
        cashOut,
        net: cashIn - cashOut
      });
    }
    
    return {
      type: 'line',
      labels: projectionData.map(d => d.week),
      datasets: [
        {
          label: 'Cash In (IDR)',
          data: projectionData.map(d => d.cashIn),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1
        },
        {
          label: 'Cash Out (IDR)',
          data: projectionData.map(d => d.cashOut),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1
        },
        {
          label: 'Net Cash Flow (IDR)',
          data: projectionData.map(d => d.net),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        }
      ]
    };
  },
  
  async generateLCStatusChart(): Promise<any> {
    const lcs = await lcService.getAllLCs();
    
    const statusCounts = lcs.reduce((acc, lc) => {
      acc[lc.status] = (acc[lc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusOrder = ['Draft', 'Issued', 'Confirmed', 'Amended', 'Utilized', 'Expired'];
    const colors = {
      'Draft': 'rgba(107, 114, 128, 0.8)',
      'Issued': 'rgba(59, 130, 246, 0.8)',
      'Confirmed': 'rgba(16, 185, 129, 0.8)',
      'Amended': 'rgba(245, 158, 11, 0.8)',
      'Utilized': 'rgba(139, 92, 246, 0.8)',
      'Expired': 'rgba(239, 68, 68, 0.8)'
    };
    
    return {
      type: 'doughnut',
      labels: statusOrder.filter(status => statusCounts[status] > 0),
      datasets: [{
        data: statusOrder.filter(status => statusCounts[status] > 0).map(status => statusCounts[status]),
        backgroundColor: statusOrder.filter(status => statusCounts[status] > 0).map(status => colors[status as keyof typeof colors])
      }]
    };
  },
  
  async generateInvoiceAgingChart(): Promise<any> {
    const invoices = await invoiceService.getAllInvoices();
    const today = new Date();
    
    const agingBuckets = {
      'Current': 0,
      '1-30 days': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0
    };
    
    invoices
      .filter(inv => inv.payment_status !== 'Paid')
      .forEach(inv => {
        const dueDate = new Date(inv.due_date);
        const daysDiff = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = inv.total_amount_idr || 0;
        
        if (daysDiff <= 0) {
          agingBuckets['Current'] += amount;
        } else if (daysDiff <= 30) {
          agingBuckets['1-30 days'] += amount;
        } else if (daysDiff <= 60) {
          agingBuckets['31-60 days'] += amount;
        } else if (daysDiff <= 90) {
          agingBuckets['61-90 days'] += amount;
        } else {
          agingBuckets['90+ days'] += amount;
        }
      });
    
    return {
      type: 'bar',
      labels: Object.keys(agingBuckets),
      datasets: [{
        label: 'Outstanding Amount (IDR)',
        data: Object.values(agingBuckets),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(127, 29, 29, 0.8)'
        ]
      }]
    };
  },
  
  async generateCurrencyChart(startDate: string, endDate: string): Promise<any> {
    const invoices = await invoiceService.getAllInvoices();
    const filteredInvoices = invoices.filter(inv => {
      const invoiceDate = inv.invoice_date || inv.created_at.split('T')[0];
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
    
    // Group revenue by business classification using the new customer_business_type field
    const revenueBySegment = {
      'Trading Company': 0,
      'Direct End Customer': 0,
      'Manufacturer': 0,
      'Distributor': 0,
      'Retailer': 0,
      'Individual Buyer': 0,
      'Government/Institution': 0,
      'Export Agent': 0,
      'Other': 0,
      'Not Specified': 0  // For existing records without classification
    };
    
    // Group invoices by their business type classification
    filteredInvoices.forEach(inv => {
      const amount = inv.total_amount_idr || 0;
      const businessType = inv.customer_business_type;
      
      if (businessType && revenueBySegment.hasOwnProperty(businessType)) {
        revenueBySegment[businessType as keyof typeof revenueBySegment] += amount;
      } else if (!businessType) {
        // Handle existing invoices without classification
        revenueBySegment['Not Specified'] += amount;
      } else {
        // Handle any unexpected business types
        revenueBySegment['Other'] += amount;
      }
    });
    
    // Filter out segments with zero revenue and sort by amount
    const nonZeroSegments = Object.entries(revenueBySegment)
      .filter(([, amount]) => amount > 0)
      .sort(([,a], [,b]) => b - a);
    
    // Assign colors for better visualization
    const segmentColors = {
      'Trading Company': 'rgba(59, 130, 246, 0.8)',     // Blue
      'Direct End Customer': 'rgba(16, 185, 129, 0.8)', // Green
      'Manufacturer': 'rgba(245, 158, 11, 0.8)',        // Yellow
      'Distributor': 'rgba(139, 92, 246, 0.8)',         // Purple
      'Retailer': 'rgba(236, 72, 153, 0.8)',            // Pink
      'Individual Buyer': 'rgba(6, 182, 212, 0.8)',     // Cyan
      'Government/Institution': 'rgba(34, 197, 94, 0.8)', // Emerald
      'Export Agent': 'rgba(251, 146, 60, 0.8)',        // Orange
      'Other': 'rgba(107, 114, 128, 0.8)',              // Gray
      'Not Specified': 'rgba(156, 163, 175, 0.8)'       // Light Gray
    };
    
    return {
      type: 'doughnut',
      labels: nonZeroSegments.map(([segment]) => segment),
      datasets: [{
        data: nonZeroSegments.map(([, amount]) => amount),
        backgroundColor: nonZeroSegments.map(([segment]) => 
          segmentColors[segment as keyof typeof segmentColors] || 'rgba(107, 114, 128, 0.8)'
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    };
  },
  
  // Utility helper methods
  groupDataByPeriod(data: any[], groupBy: string, dateField: string): Record<string, any[]> {
    return data.reduce((acc, item) => {
      const date = new Date(item[dateField] || item.created_at);
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  },
  
  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  },
  
  formatPeriodLabel(key: string, groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return new Date(key).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      case 'week':
        const [year, week] = key.split('-W');
        return `${week}/${year}`;
      case 'month':
        const [y, m] = key.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      case 'quarter':
        const [qYear, quarter] = key.split('-Q');
        return `Q${quarter}/${qYear}`;
      case 'year':
        return key;
      default:
        return key;
    }
  },
  
  getRegionFromCustomerName(customerName: string): string {
    // Simple region mapping - can be enhanced with a proper database
    const name = customerName.toLowerCase();
    if (name.includes('singapore') || name.includes('spore')) return 'Singapore';
    if (name.includes('malaysia') || name.includes('kuala lumpur')) return 'Malaysia';
    if (name.includes('thailand') || name.includes('bangkok')) return 'Thailand';
    if (name.includes('vietnam') || name.includes('ho chi minh')) return 'Vietnam';
    if (name.includes('philippines') || name.includes('manila')) return 'Philippines';
    if (name.includes('china') || name.includes('beijing') || name.includes('shanghai')) return 'China';
    if (name.includes('japan') || name.includes('tokyo')) return 'Japan';
    if (name.includes('korea') || name.includes('seoul')) return 'South Korea';
    if (name.includes('usa') || name.includes('america') || name.includes('new york')) return 'USA';
    if (name.includes('europe') || name.includes('germany') || name.includes('uk')) return 'Europe';
    return 'Other';
  },
  
  // Enhanced currency formatting specifically for Indonesian Rupiah
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },
  
  // Format large numbers in Indonesian context
  formatIndonesianNumber(num: number): string {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)} Miliar`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} Juta`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} Ribu`;
    }
    return num.toString();
  },
  
  getAlertTitle(alertType: string): string {
    const titles = {
      'UPCOMING': 'Pembayaran Akan Jatuh Tempo',
      'OVERDUE': 'Pembayaran Terlambat',
      'PARTIAL_FOLLOW_UP': 'Follow Up Pembayaran Partial'
    };
    return titles[alertType as keyof typeof titles] || 'Notifikasi Pembayaran';
  },
  
  getDefaultAlertMessage(alert: any): string {
    switch (alert.alert_type) {
      case 'UPCOMING':
        return `Pembayaran akan jatuh tempo dalam ${alert.days_before_due} hari`;
      case 'OVERDUE':
        return `Pembayaran terlambat ${alert.days_overdue} hari`;
      case 'PARTIAL_FOLLOW_UP':
        return 'Perlu follow up untuk pembayaran partial';
      default:
        return 'Notifikasi pembayaran memerlukan perhatian';
    }
  }
};