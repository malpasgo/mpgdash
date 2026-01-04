import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { invoiceService, Invoice, InvoicePayment } from '@/lib/supabase';
import { cn, formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  invoice: Invoice;
  onSave: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ invoice, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    payment_date: new Date(),
    amount: 0,
    currency: invoice.currency,
    exchange_rate: invoice.exchange_rate,
    payment_method: 'Bank Transfer' as InvoicePayment['payment_method'],
    reference_number: '',
    bank_account: '',
    received_by: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [amountIDR, setAmountIDR] = useState(0);

  React.useEffect(() => {
    calculateAmountIDR();
  }, [formData.amount, formData.exchange_rate]);

  const calculateAmountIDR = () => {
    const calculated = formData.amount * formData.exchange_rate;
    setAmountIDR(calculated);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount harus lebih dari 0';
    }
    
    if (formData.amount > getOutstandingAmount()) {
      newErrors.amount = 'Amount tidak boleh melebihi outstanding amount';
    }
    
    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method wajib dipilih';
    }
    
    if (!formData.reference_number.trim()) {
      newErrors.reference_number = 'Reference number wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getOutstandingAmount = () => {
    // This should come from props ideally, but for now we'll calculate
    // In a real implementation, you'd pass the outstanding amount as a prop
    return invoice.total_amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        invoice_id: invoice.id,
        payment_date: format(formData.payment_date, 'yyyy-MM-dd'),
        amount: formData.amount,
        currency: formData.currency,
        exchange_rate: formData.exchange_rate,
        amount_idr: amountIDR,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        bank_account: formData.bank_account,
        received_by: formData.received_by,
        notes: formData.notes
      };

      await invoiceService.createInvoicePayment(paymentData);
      onSave();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Terjadi kesalahan saat menyimpan payment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Add Payment for {invoice.invoice_number}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.payment_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.payment_date ? (
                    format(formData.payment_date, 'dd MMMM yyyy', { locale: id })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.payment_date}
                  onSelect={(date) => date && handleInputChange('payment_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount ({formData.currency}) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Exchange Rate</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.exchange_rate}
                onChange={(e) => handleInputChange('exchange_rate', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Amount IDR Display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount in IDR:</span>
              <span className="font-medium">
                {formatCurrency(amountIDR, 'IDR')}
              </span>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => handleInputChange('payment_method', value as InvoicePayment['payment_method'])}
            >
              <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="LC">Letter of Credit</SelectItem>
                <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-sm text-red-600">{errors.payment_method}</p>
            )}
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label>Reference Number *</Label>
            <Input
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="Transaction ID, Check number, etc."
              className={errors.reference_number ? 'border-red-500' : ''}
            />
            {errors.reference_number && (
              <p className="text-sm text-red-600">{errors.reference_number}</p>
            )}
          </div>

          {/* Bank Account */}
          <div className="space-y-2">
            <Label>Bank Account</Label>
            <Input
              value={formData.bank_account}
              onChange={(e) => handleInputChange('bank_account', e.target.value)}
              placeholder="Receiving bank account"
            />
          </div>

          {/* Received By */}
          <div className="space-y-2">
            <Label>Received By</Label>
            <Input
              value={formData.received_by}
              onChange={(e) => handleInputChange('received_by', e.target.value)}
              placeholder="Person who received the payment"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this payment"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Menyimpan...' : 'Simpan Payment'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;