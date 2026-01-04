import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Trash2, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { invoiceService, lcService, paymentTermsService, Invoice, InvoiceItem, LetterOfCredit, PaymentTermsMaster } from '@/lib/supabase';
import { cn, formatCurrency } from '@/lib/utils';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormInvoiceItem {
  id?: string;
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
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_type: 'Proforma' as Invoice['invoice_type'],
    lc_id: '',
    customer_name: '',
    customer_address: '',
    customer_email: '',
    customer_phone: '',
    customer_business_type: '',
    invoice_date: new Date(),
    due_date: null as Date | null,
    payment_terms: '',
    currency: 'USD',
    exchange_rate: 15750,
    tax_rate: 0,
    discount_amount: 0,
    status: 'Draft' as Invoice['status'],
    payment_status: 'Unpaid' as Invoice['payment_status'],
    notes: '',
    internal_notes: ''
  });
  
  const [items, setItems] = useState<FormInvoiceItem[]>([{
    line_number: 1,
    description: '',
    quantity: 1,
    unit_price: 0,
    currency: 'USD',
    amount: 0,
    amount_idr: 0,
    unit_of_measure: 'pcs'
  }]);
  
  const [lcs, setLCs] = useState<LetterOfCredit[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAmountIDR, setTotalAmountIDR] = useState(0);
  
  // Auto-Save Prevention System
  const [isIntentionalSave, setIsIntentionalSave] = useState(false);
  const [stepTransitioning, setStepTransitioning] = useState(false);

  // Auto-Calculation Control System  
  const [calculationPending, setCalculationPending] = useState(false);
  const [debouncedCalculationTimeout, setDebouncedCalculationTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadLCs = async () => {
      try {
        const lcsData = await lcService.getAllLCs();
        setLCs(lcsData);
      } catch (error) {
        console.error('Error loading LCs:', error);
      }
    };
    
    const loadPaymentTerms = async () => {
      try {
        const paymentTermsData = await paymentTermsService.getAllPaymentTerms();
        setPaymentTerms(paymentTermsData);
      } catch (error) {
        console.error('Error loading payment terms:', error);
      }
    };
    
    loadLCs();
    loadPaymentTerms();
    if (invoice) {
      populateFormFromInvoice();
    }
  }, [invoice]);

  useEffect(() => {
    // Calculate totals when form data or items change
    const calculateItemTotals = () => {
      const itemsSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const tax = (itemsSubtotal * (formData.tax_rate || 0)) / 100;
      const total = itemsSubtotal + tax - (formData.discount_amount || 0);
      const totalIDR = total * formData.exchange_rate;

      setSubtotal(itemsSubtotal);
      setTaxAmount(tax);
      setTotalAmount(total);
      setTotalAmountIDR(totalIDR);
      setCalculationPending(false);
    };

    calculateItemTotals();
  }, [items, formData.tax_rate, formData.discount_amount, formData.exchange_rate]);
  
  useEffect(() => {
    if (formData.invoice_type && !invoice) {
      generateInvoiceNumber();
    }
  }, [formData.invoice_type]);
  
  // Set default payment terms ketika data payment terms sudah ter-load
  useEffect(() => {
    if (paymentTerms.length > 0 && !formData.payment_terms && !invoice) {
      const defaultTerm = paymentTerms.find(term => term.is_default) || paymentTerms[0];
      setFormData(prev => ({ ...prev, payment_terms: defaultTerm.term_name }));
    }
  }, [paymentTerms, formData.payment_terms, invoice]);

  // Cleanup effect for debounced calculation timeout
  useEffect(() => {
    return () => {
      if (debouncedCalculationTimeout) {
        clearTimeout(debouncedCalculationTimeout);
      }
    };
  }, [debouncedCalculationTimeout]);

  const generateInvoiceNumber = async () => {
    try {
      const invoiceNumber = await invoiceService.generateInvoiceNumber(formData.invoice_type);
      setFormData(prev => ({ ...prev, invoice_number: invoiceNumber }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  };

  const populateFormFromInvoice = async () => {
    if (!invoice) return;
    
    setFormData({
      invoice_number: invoice.invoice_number,
      invoice_type: invoice.invoice_type,
      lc_id: invoice.lc_id || '',
      customer_name: invoice.customer_name,
      customer_address: invoice.customer_address || '',
      customer_email: invoice.customer_email || '',
      customer_phone: invoice.customer_phone || '',
      customer_business_type: invoice.customer_business_type || '',
      invoice_date: new Date(invoice.invoice_date),
      due_date: invoice.due_date ? new Date(invoice.due_date) : null,
      payment_terms: invoice.payment_terms || '',
      currency: invoice.currency,
      exchange_rate: invoice.exchange_rate,
      tax_rate: invoice.tax_rate || 0,
      discount_amount: invoice.discount_amount || 0,
      status: invoice.status,
      payment_status: invoice.payment_status,
      notes: invoice.notes || '',
      internal_notes: invoice.internal_notes || ''
    });

    // Load invoice items
    try {
      const invoiceItems = await invoiceService.getInvoiceItems(invoice.id);
      if (invoiceItems.length > 0) {
        setItems(invoiceItems.map(item => ({
          id: item.id,
          line_number: item.line_number,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency: item.currency,
          amount: item.amount,
          amount_idr: item.amount_idr,
          hs_code: item.hs_code,
          weight: item.weight,
          dimension: item.dimension,
          unit_of_measure: item.unit_of_measure
        })));
      }
    } catch (error) {
      console.error('Error loading invoice items:', error);
    }
  };



  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.invoice_number.trim()) {
        newErrors.invoice_number = 'Nomor invoice wajib diisi';
      }
      if (!formData.customer_name.trim()) {
        newErrors.customer_name = 'Nama customer wajib diisi';
      }
      if (!formData.customer_business_type) {
        newErrors.customer_business_type = 'Business classification wajib dipilih';
      }
      if (!formData.due_date) {
        newErrors.due_date = 'Tanggal jatuh tempo wajib diisi';
      }
    }

    if (stepNumber === 2) {
      if (items.length === 0) {
        newErrors.items = 'Minimal harus ada 1 item';
      }
      
      items.forEach((item, index) => {
        if (!item.description.trim()) {
          newErrors[`item_${index}_description`] = 'Deskripsi item wajib diisi';
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity harus lebih dari 0';
        }
        if (item.unit_price <= 0) {
          newErrors[`item_${index}_unit_price`] = 'Unit price harus lebih dari 0';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (stepTransitioning) return; // Prevent double-click
    
    setStepTransitioning(true);
    if (validateStep(step)) {
      setStep(step + 1);
    }
    setTimeout(() => setStepTransitioning(false), 300);
  };

  const handlePrevStep = () => {
    if (stepTransitioning) return; // Prevent double-click
    
    setStepTransitioning(true);
    setStep(step - 1);
    setTimeout(() => setStepTransitioning(false), 300);
  };

  const handleIntentionalSave = () => {
    setIsIntentionalSave(true);
    // Trigger form submission after setting the flag
    const form = document.getElementById('invoice-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };
  
  // Enhanced Input Protection System
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isIntentionalSave) {
      e.preventDefault();
      console.log('Enter key prevented in input field');
    }
  };
  
  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isIntentionalSave) {
      e.preventDefault();
      console.log('Ctrl+Enter prevented in textarea');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent accidental save - only allow if explicitly set
    if (!isIntentionalSave) {
      console.log('Save prevented - not intentional');
      return;
    }
    
    if (!validateStep(step)) {
      setIsIntentionalSave(false); // Reset flag
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        invoice_number: formData.invoice_number,
        invoice_type: formData.invoice_type,
        lc_id: formData.lc_id || undefined,
        customer_name: formData.customer_name,
        customer_address: formData.customer_address,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_business_type: formData.customer_business_type,
        invoice_date: format(formData.invoice_date, 'yyyy-MM-dd'),
        due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : '',
        payment_terms: formData.payment_terms,
        currency: formData.currency,
        exchange_rate: formData.exchange_rate,
        subtotal: subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: taxAmount,
        discount_amount: formData.discount_amount,
        total_amount: totalAmount,
        total_amount_idr: totalAmountIDR,
        status: formData.status,
        payment_status: formData.payment_status,
        notes: formData.notes,
        internal_notes: formData.internal_notes
      };

      let savedInvoice: Invoice;
      if (invoice) {
        savedInvoice = await invoiceService.updateInvoice(invoice.id, invoiceData);
      } else {
        savedInvoice = await invoiceService.createInvoice(invoiceData);
      }

      // Save invoice items
      for (const item of items) {
        const itemData = {
          invoice_id: savedInvoice.id,
          line_number: item.line_number,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency: item.currency,
          amount: item.amount,
          amount_idr: item.amount_idr,
          hs_code: item.hs_code,
          weight: item.weight,
          dimension: item.dimension,
          unit_of_measure: item.unit_of_measure
        };

        if (item.id) {
          await invoiceService.updateInvoiceItem(item.id, itemData);
        } else {
          await invoiceService.createInvoiceItem(itemData);
        }
      }

      onSave();
      // Reset the intentional save flag after successful save
      setIsIntentionalSave(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Terjadi kesalahan saat menyimpan invoice');
      // Reset flag on error too
      setIsIntentionalSave(false);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: FormInvoiceItem = {
      line_number: items.length + 1,
      description: '',
      quantity: 1,
      unit_price: 0,
      currency: formData.currency,
      amount: 0,
      amount_idr: 0,
      unit_of_measure: 'pcs'
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Reorder line numbers
    const reorderedItems = newItems.map((item, i) => ({
      ...item,
      line_number: i + 1
    }));
    setItems(reorderedItems);
  };

  const updateItem = (index: number, field: keyof FormInvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate amount when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : newItems[index].unit_price;
      const amount = quantity * unitPrice;
      const amountIDR = amount * formData.exchange_rate;
      
      // Update amounts in a controlled manner
      newItems[index] = {
        ...newItems[index],
        amount,
        amount_idr: amountIDR
      };
    }
    
    // Single state update to prevent cascade
    setItems(newItems);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Informasi Invoice</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="invoice_number">Nomor Invoice *</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
            onKeyDown={handleInputKeyDown}
            placeholder="Nomor invoice"
            className={errors.invoice_number ? 'border-red-500' : ''}
            disabled={!!invoice}
          />
          {errors.invoice_number && (
            <p className="text-sm text-red-500 mt-1">{errors.invoice_number}</p>
          )}
        </div>

        <div>
          <Label htmlFor="invoice_type">Jenis Invoice</Label>
          <Select 
            value={formData.invoice_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, invoice_type: value as Invoice['invoice_type'] }))}
          >
            <SelectTrigger onPointerDown={(e) => e.stopPropagation()}>
              <SelectValue placeholder="Pilih jenis invoice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Proforma">Proforma Invoice</SelectItem>
              <SelectItem value="Commercial">Commercial Invoice</SelectItem>
              <SelectItem value="Credit Note">Credit Note</SelectItem>
              <SelectItem value="Debit Note">Debit Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="customer_name">Nama Customer *</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
            onKeyDown={handleInputKeyDown}
            placeholder="Nama customer"
            className={errors.customer_name ? 'border-red-500' : ''}
          />
          {errors.customer_name && (
            <p className="text-sm text-red-500 mt-1">{errors.customer_name}</p>
          )}
        </div>
        
        <div>
          <Label className="text-sm font-medium leading-[1.4] whitespace-normal break-words block mb-2">Tanggal Invoice</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-white hover:bg-gray-50",
                  !formData.invoice_date && "text-muted-foreground"
                )}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.invoice_date ? format(formData.invoice_date, 'dd/MM/yyyy', { locale: id }) : 'Pilih tanggal'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.invoice_date}
                onSelect={(date) => setFormData(prev => ({ ...prev, invoice_date: date || new Date() }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-sm font-medium leading-[1.4] whitespace-normal break-words block mb-2">Tanggal Jatuh Tempo *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-white hover:bg-gray-50",
                  !formData.due_date && "text-muted-foreground",
                  errors.due_date && "border-red-500"
                )}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? format(formData.due_date, 'dd/MM/yyyy', { locale: id }) : 'Pilih tanggal'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.due_date || undefined}
                onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date || null }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.due_date && (
            <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="customer_business_type">Business Classification *</Label>
          <Select 
            value={formData.customer_business_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, customer_business_type: value }))}
          >
            <SelectTrigger 
              onPointerDown={(e) => e.stopPropagation()}
              className={errors.customer_business_type ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Trading Company">Trading Company - Intermediary trading partners who resell products</SelectItem>
              <SelectItem value="Direct End Customer">Direct End Customer - Final consumers or end users of products</SelectItem>
              <SelectItem value="Manufacturer">Manufacturer - Companies that use products as raw materials/components</SelectItem>
              <SelectItem value="Distributor">Distributor - Wholesale distributors who sell to retailers</SelectItem>
              <SelectItem value="Retailer">Retailer - Retail companies selling directly to consumers</SelectItem>
              <SelectItem value="Individual Buyer">Individual Buyer - Individual/personal purchases</SelectItem>
              <SelectItem value="Government/Institution">Government/Institution - Government agencies or institutional buyers</SelectItem>
              <SelectItem value="Export Agent">Export Agent - Export agents or representatives</SelectItem>
              <SelectItem value="Other">Other - Other business types not listed above</SelectItem>
            </SelectContent>
          </Select>
          {errors.customer_business_type && (
            <p className="text-sm text-red-500 mt-1">{errors.customer_business_type}</p>
          )}
        </div>

        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Business Classification Purpose:</p>
            <p>Used for accurate export segment analytics and revenue reporting.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Select value={formData.payment_terms} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}>
            <SelectTrigger onPointerDown={(e) => e.stopPropagation()}>
              <SelectValue placeholder="Payment terms" />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-[1200px] max-h-[414px]" style={{minWidth: '1200px'}}>
              {paymentTerms.map((term) => (
                <SelectItem key={term.id} value={term.term_name}>
                  <span className="font-bold">{term.term_name}</span>
                  {term.term_description && <span className="font-normal"> - {term.term_description}</span>}
                </SelectItem>
              ))}
              {/* Fallback options jika data tidak tersedia */}
              {paymentTerms.length === 0 && (
                <>
                  <SelectItem value="COD"><span className="font-bold">COD</span><span className="font-normal"> (Cash on Delivery)</span></SelectItem>
                  <SelectItem value="Net 30"><span className="font-bold">Net 30</span><span className="font-normal"> days</span></SelectItem>
                  <SelectItem value="Net 60"><span className="font-bold">Net 60</span><span className="font-normal"> days</span></SelectItem>
                  <SelectItem value="Net 90"><span className="font-bold">Net 90</span><span className="font-normal"> days</span></SelectItem>
                  <SelectItem value="DP 50%"><span className="font-bold">DP 50%</span></SelectItem>
                  <SelectItem value="Custom"><span className="font-bold">Custom</span></SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="lc_id">Link to LC (Optional)</Label>
          <Select 
            value={formData.lc_id ? `${lcs.find(lc => lc.id === formData.lc_id)?.lc_number} - ${lcs.find(lc => lc.id === formData.lc_id)?.applicant}` : ''} 
            onValueChange={(value) => {
              if (value === '') {
                setFormData(prev => ({ ...prev, lc_id: '' }));
              } else {
                const selectedLc = lcs.find(lc => `${lc.lc_number} - ${lc.applicant}` === value);
                if (selectedLc) {
                  setFormData(prev => ({ ...prev, lc_id: selectedLc.id }));
                }
              }
            }}
          >
            <SelectTrigger onPointerDown={(e) => e.stopPropagation()}>
              <SelectValue placeholder="Pilih LC" />
            </SelectTrigger>
            <SelectContent className="w-[400px] max-h-[414px]">
              <SelectItem value="">No LC</SelectItem>
              {lcs.map((lc) => (
                <SelectItem key={lc.id} value={`${lc.lc_number} - ${lc.applicant}`}>
                  <span className="font-bold">{lc.lc_number}</span><span className="font-normal"> - {lc.applicant}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="customer_address">Alamat Customer</Label>
        <Textarea
          id="customer_address"
          value={formData.customer_address}
          onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Alamat lengkap customer"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="customer_email">Email Customer</Label>
          <Input
            id="customer_email"
            type="email"
            value={formData.customer_email}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
            placeholder="email@customer.com"
          />
        </div>

        <div>
          <Label htmlFor="customer_phone">Telepon Customer</Label>
          <Input
            id="customer_phone"
            value={formData.customer_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
            placeholder="+62 xxx xxxx xxxx"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="currency">Mata Uang</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
            <SelectTrigger onPointerDown={(e) => e.stopPropagation()}>
              <SelectValue placeholder="Pilih mata uang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
              <SelectItem value="SGD">SGD</SelectItem>
              <SelectItem value="IDR">IDR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="exchange_rate">Kurs ke IDR</Label>
          <Input
            id="exchange_rate"
            type="number"
            step="0.01"
            value={formData.exchange_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: parseFloat(e.target.value) || 0 }))}
            placeholder="15750.00"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Item Invoice</h3>
        <Button type="button" onClick={addItem} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Item
        </Button>
      </div>

      {errors.items && (
        <p className="text-sm text-red-500">{errors.items}</p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base text-gray-800">Item #{item.line_number}</CardTitle>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Deskripsi *</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Deskripsi produk atau jasa"
                  className={errors[`item_${index}_description`] ? 'border-red-500' : ''}
                />
                {errors[`item_${index}_description`] && (
                  <p className="text-sm text-red-500 mt-1">{errors[`item_${index}_description`]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className={errors[`item_${index}_quantity`] ? 'border-red-500' : ''}
                  />
                  {errors[`item_${index}_quantity`] && (
                    <p className="text-sm text-red-500 mt-1">{errors[`item_${index}_quantity`]}</p>
                  )}
                </div>

                <div>
                  <Label>Unit</Label>
                  <Input
                    value={item.unit_of_measure || ''}
                    onChange={(e) => updateItem(index, 'unit_of_measure', e.target.value)}
                    placeholder="pcs, kg, m, etc"
                  />
                </div>

                <div>
                  <Label>Unit Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className={errors[`item_${index}_unit_price`] ? 'border-red-500' : ''}
                  />
                  {errors[`item_${index}_unit_price`] && (
                    <p className="text-sm text-red-500 mt-1">{errors[`item_${index}_unit_price`]}</p>
                  )}
                </div>

                <div>
                  <Label>Amount</Label>
                  <Input
                    value={formatCurrency(item.amount, formData.currency)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label>Amount (IDR)</Label>
                  <Input
                    value={formatCurrency(item.amount_idr, 'IDR')}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>HS Code</Label>
                  <Input
                    value={item.hs_code || ''}
                    onChange={(e) => updateItem(index, 'hs_code', e.target.value)}
                    placeholder="HS Code untuk export"
                  />
                </div>

                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.weight || ''}
                    onChange={(e) => updateItem(index, 'weight', parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Dimensi</Label>
                  <Input
                    value={item.dimension || ''}
                    onChange={(e) => updateItem(index, 'dimension', e.target.value)}
                    placeholder="L x W x H (cm)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Review & Finalisasi</h3>
      
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800">
            <Calculator className="w-5 h-5 mr-2" />
            Ringkasan Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-800">Subtotal ({formData.currency}):</span>
              <div className="font-medium text-gray-800" style={{color: '#1f2937'}}>{formatCurrency(subtotal, formData.currency)}</div>
            </div>
            
            {formData.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-800">Pajak ({formData.tax_rate}%):</span>
                <div className="font-medium text-gray-800" style={{color: '#1f2937'}}>{formatCurrency(taxAmount, formData.currency)}</div>
              </div>
            )}
            
            {formData.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-800">Diskon:</span>
                <div className="font-medium text-red-600" style={{color: '#dc2626'}}>-{formatCurrency(formData.discount_amount, formData.currency)}</div>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800">Total ({formData.currency}):</span>
                <div className="text-gray-800" style={{color: '#1f2937'}}>{formatCurrency(totalAmount, formData.currency)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-800 font-medium">Total (IDR):</span>
                <div className="text-gray-800" style={{color: '#1f2937'}}>{formatCurrency(totalAmountIDR, 'IDR')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="tax_rate">Tax Rate (%)</Label>
          <Input
            id="tax_rate"
            type="number"
            step="0.01"
            value={formData.tax_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="discount_amount">Diskon Amount</Label>
          <Input
            id="discount_amount"
            type="number"
            step="0.01"
            value={formData.discount_amount}
            onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="status">Status Invoice</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Invoice['status'] }))}>
            <SelectTrigger onPointerDown={(e) => e.stopPropagation()}>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="payment_status">Status Pembayaran</Label>
          <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as Invoice['payment_status'] }))}>
            <SelectTrigger onPointerDown={(e) => e.stopPropagation()}>
              <SelectValue placeholder="Pilih status pembayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes untuk Customer</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Catatan untuk customer (akan tampil di invoice)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="internal_notes">Internal Notes</Label>
        <Textarea
          id="internal_notes"
          value={formData.internal_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
          placeholder="Catatan internal (tidak akan tampil di invoice)"
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <form 
      id="invoice-form"
      onSubmit={handleSubmit} 
      className="space-y-6" 
      onKeyDown={(e) => {
        // Prevent form submission when pressing Enter in dropdown/date fields
        if (e.key === 'Enter' && e.target instanceof HTMLElement) {
          const tagName = e.target.tagName.toLowerCase();
          if (tagName === 'button' && !(e.target as HTMLButtonElement).type) {
            e.preventDefault();
          }
        }
        // Prevent Enter key from triggering unintended submits
        if (e.key === 'Enter' && !isIntentionalSave) {
          e.preventDefault();
        }
      }}
    >
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNumber 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`w-12 h-1 mx-2 ${
                step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <div>
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrevStep}
              disabled={stepTransitioning}
            >
              {stepTransitioning ? 'Loading...' : 'Sebelumnya'}
            </Button>
          )}
        </div>
        
        <div className="flex space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          
          {step < 3 ? (
            <Button 
              type="button" 
              onClick={handleNextStep}
              disabled={stepTransitioning}
            >
              {stepTransitioning ? 'Loading...' : 'Selanjutnya'}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleIntentionalSave}
              disabled={loading || stepTransitioning}
            >
              {loading ? 'Menyimpan...' : (invoice ? 'Update Invoice' : 'Simpan Invoice')}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default InvoiceForm;