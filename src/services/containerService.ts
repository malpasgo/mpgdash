import { supabase } from '@/lib/supabase';

// Types
export interface ContainerType {
  id: string;
  name: string;
  type_code: string;
  internal_length: number;
  internal_width: number;
  internal_height: number;
  max_payload: number;
  tare_weight: number;
  cubic_capacity: number;
  rental_cost: number;
}

export interface ShippingRoute {
  id: string;
  origin_port: string;
  destination_port: string;
  route_code: string;
  transit_days: number;
  distance_km: number;
  base_handling_cost: number;
  documentation_fee: number;
  insurance_rate: number;
}

export interface ContainerCalculation {
  id?: string;
  calculation_name?: string;
  container_type_id: string;
  shipping_route_id?: string;
  cargo_length: number;
  cargo_width: number;
  cargo_height: number;
  cargo_weight: number;
  cargo_quantity?: number; // Jumlah box/unit
  dimension_unit: string;
  weight_unit: string;
  cargo_value?: number;
  max_boxes?: number;
  loading_efficiency?: number;
  total_weight?: number;
  total_cbm?: number;
  total_cost?: number;
  calculation_data?: any;
}

export interface CostComponent {
  id?: string;
  calculation_id: string;
  component_name: string;
  component_cost: number;
  component_type: string;
}

export interface LoadingPlan {
  id?: string;
  calculation_id: string;
  plan_name?: string;
  container_layout: any;
  weight_distribution?: any;
  loading_instructions?: string;
  arrangement_pattern: string;
  length_count: number;
  width_count: number;
  height_count: number;
  visualization_data?: any;
}

// Container Types Service
export const containerTypesService = {
  async getAll(): Promise<ContainerType[]> {
    const { data, error } = await supabase
      .from('container_types')
      .select('*')
      .order('rental_cost', { ascending: true });
    
    if (error) {
      console.error('Error fetching container types:', error);
      throw error;
    }
    
    return data || [];
  },

  async getById(id: string): Promise<ContainerType | null> {
    const { data, error } = await supabase
      .from('container_types')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching container type:', error);
      throw error;
    }
    
    return data;
  }
};

// Shipping Routes Service
export const shippingRoutesService = {
  async getAll(): Promise<ShippingRoute[]> {
    const { data, error } = await supabase
      .from('shipping_routes')
      .select('*')
      .order('transit_days', { ascending: true });
    
    if (error) {
      console.error('Error fetching shipping routes:', error);
      throw error;
    }
    
    return data || [];
  },

  async getById(id: string): Promise<ShippingRoute | null> {
    const { data, error } = await supabase
      .from('shipping_routes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching shipping route:', error);
      throw error;
    }
    
    return data;
  }
};

// Container Calculations Service
export const calculationsService = {
  async save(calculation: ContainerCalculation): Promise<string> {
    const { data, error } = await supabase
      .from('container_calculations')
      .insert([calculation])
      .select('id')
      .maybeSingle();
    
    if (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from calculation save');
    }
    
    return data.id;
  },

  async getHistory(limit = 20): Promise<ContainerCalculation[]> {
    const { data, error } = await supabase
      .from('container_calculations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching calculation history:', error);
      throw error;
    }
    
    return data || [];
  },

  async getById(id: string): Promise<ContainerCalculation | null> {
    const { data, error } = await supabase
      .from('container_calculations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching calculation:', error);
      throw error;
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('container_calculations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting calculation:', error);
      throw error;
    }
  }
};

// Cost Components Service
export const costComponentsService = {
  async save(components: CostComponent[]): Promise<void> {
    const { error } = await supabase
      .from('cost_components')
      .insert(components);
    
    if (error) {
      console.error('Error saving cost components:', error);
      throw error;
    }
  },

  async getByCalculationId(calculationId: string): Promise<CostComponent[]> {
    const { data, error } = await supabase
      .from('cost_components')
      .select('*')
      .eq('calculation_id', calculationId)
      .order('component_type', { ascending: true });
    
    if (error) {
      console.error('Error fetching cost components:', error);
      throw error;
    }
    
    return data || [];
  }
};

// Loading Plans Service
export const loadingPlansService = {
  async save(plan: LoadingPlan): Promise<string> {
    const { data, error } = await supabase
      .from('loading_plans')
      .insert([plan])
      .select('id')
      .maybeSingle();
    
    if (error) {
      console.error('Error saving loading plan:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from loading plan save');
    }
    
    return data.id;
  },

  async getByCalculationId(calculationId: string): Promise<LoadingPlan | null> {
    const { data, error } = await supabase
      .from('loading_plans')
      .select('*')
      .eq('calculation_id', calculationId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching loading plan:', error);
      throw error;
    }
    
    return data;
  }
};