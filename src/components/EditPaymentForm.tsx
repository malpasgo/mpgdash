import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Calculator } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { invoiceService, Invoice, InvoicePayment } from '@/lib/supabase';
import { cn, formatCurrency } from '@/lib/utils';
import CustomSelect from './CustomSelect';

interface EditPaymentFormProps {
  payment: InvoicePayment;
  invoice: Invoice;
  onSave: () => void;
  onCancel: () => void;
}

const EditPaymentForm: React.FC<EditPaymentFormProps> = ({ 
  payment, 
  invoice, 
  onSave, 
  onCancel
}) => {
  const [formData, setFormData] = useState({
    payment_date: parseISO(payment.payment_date),
    amount: payment.amount,
    currency: payment.currency,
    exchange_rate: payment.exchange_rate,
    payment_method: payment.payment_method,
    reference_number: payment.reference_number || '',
    bank_account: payment.bank_account || '',
    received_by: payment.received_by || '',
    notes: payment.notes || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [amountIDR, setAmountIDR] = useState(payment.amount_idr);

  useEffect(() => {
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
    
    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method wajib dipilih';
    }
    
    if (!formData.reference_number.trim()) {
      newErrors.reference_number = 'Reference number wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
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

      await invoiceService.updateInvoicePayment(payment.id, paymentData);
      onSave();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Terjadi kesalahan saat mengupdate payment');
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
    <div className="space-y-6">
      {/* Multi-layer event isolation wrapper */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Allow normal form navigation but prevent propagation
          if (e.key !== 'Escape') {
            e.stopPropagation();
          }
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Picker with Event Isolation */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.payment_date && "text-muted-foreground"
                  )}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.payment_date ? (
                    format(formData.payment_date, 'dd MMMM yyyy', { locale: id })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0" 
                align="start"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Calendar
                  mode="single"
                  selected={formData.payment_date}
                  onSelect={(date) => handleInputChange('payment_date', date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payment Method with Custom Select - No Portal Issues */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <CustomSelect
              value={formData.payment_method}
              onValueChange={(value) => handleInputChange('payment_method', value as InvoicePayment['payment_method'])}
              options={[
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'LC', label: 'Letter of Credit (LC)' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Check', label: 'Check' },
                { value: 'Wire Transfer', label: 'Wire Transfer' },
                { value: 'Other', label: 'Other' }
              ]}
              placeholder="Pilih payment method"
              error={!!errors.payment_method}
            />
            {errors.payment_method && (
              <p className="text-sm text-red-600">{errors.payment_method}</p>
            )}
          </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className={errors.amount ? 'border-red-500' : ''}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <CustomSelect
              value={formData.currency}
              onValueChange={(value) => handleInputChange('currency', value)}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'IDR', label: 'IDR' },
                { value: 'EUR', label: 'EUR' },
                { value: 'SGD', label: 'SGD' },
                { value: 'MYR', label: 'MYR' },
                { value: 'CNY', label: 'CNY' }
              ]}
              placeholder="Pilih currency"
            />
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Exchange Rate
            <Calculator className="w-4 h-4" />
          </Label>
          <Input
            type="number"
            step="0.0001"
            min="0"
            value={formData.exchange_rate}
            onChange={(e) => handleInputChange('exchange_rate', parseFloat(e.target.value) || 1)}
            placeholder="1.0000"
          />
          <div className="text-sm text-gray-600">
            Amount in IDR: {formatCurrency(amountIDR, 'IDR')}
          </div>
        </div>

        {/* Reference Number */}
        <div className="space-y-2">
          <Label>Reference Number *</Label>
          <Input
            value={formData.reference_number}
            onChange={(e) => handleInputChange('reference_number', e.target.value)}
            className={errors.reference_number ? 'border-red-500' : ''}
            placeholder="Transaction reference number"
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
            placeholder="Bank account details"
          />
        </div>

        {/* Received By */}
        <div className="space-y-2">
          <Label>Received By</Label>
          <Input
            value={formData.received_by}
            onChange={(e) => handleInputChange('received_by', e.target.value)}
            placeholder="Name of person who received payment"
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

        {/* Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Payment'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default EditPaymentForm;