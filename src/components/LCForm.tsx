import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { lcService, LetterOfCredit } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface LCFormProps {
  lc?: LetterOfCredit | null;
  onSave: () => void;
  onCancel: () => void;
}

const LCForm: React.FC<LCFormProps> = ({ lc, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    lc_number: '',
    issuing_bank: '',
    advising_bank: '',
    applicant: '',
    beneficiary: '',
    lc_amount: '',
    lc_currency: 'USD',
    exchange_rate: '',
    amount_idr: '',
    issue_date: null as Date | null,
    expiry_date: null as Date | null,
    shipment_deadline: null as Date | null,
    negotiation_deadline: null as Date | null,
    status: 'Draft' as LetterOfCredit['status'],
    lc_type: 'Sight' as LetterOfCredit['lc_type'],
    payment_terms: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isIntentionalSave, setIsIntentionalSave] = useState(false);

  useEffect(() => {
    if (lc) {
      setFormData({
        lc_number: lc.lc_number || '',
        issuing_bank: lc.issuing_bank || '',
        advising_bank: lc.advising_bank || '',
        applicant: lc.applicant || '',
        beneficiary: lc.beneficiary || '',
        lc_amount: lc.lc_amount?.toString() || '',
        lc_currency: lc.lc_currency || 'USD',
        exchange_rate: lc.exchange_rate?.toString() || '',
        amount_idr: lc.amount_idr?.toString() || '',
        issue_date: lc.issue_date ? new Date(lc.issue_date) : null,
        expiry_date: lc.expiry_date ? new Date(lc.expiry_date) : null,
        shipment_deadline: lc.shipment_deadline ? new Date(lc.shipment_deadline) : null,
        negotiation_deadline: lc.negotiation_deadline ? new Date(lc.negotiation_deadline) : null,
        status: lc.status,
        lc_type: lc.lc_type,
        payment_terms: lc.payment_terms || ''
      });
    }
  }, [lc]);

  useEffect(() => {
    // Auto calculate IDR amount when LC amount or exchange rate changes
    if (formData.lc_amount && formData.exchange_rate) {
      const lcAmount = parseFloat(formData.lc_amount);
      const exchangeRate = parseFloat(formData.exchange_rate);
      if (!isNaN(lcAmount) && !isNaN(exchangeRate)) {
        const idrAmount = lcAmount * exchangeRate;
        setFormData(prev => ({
          ...prev,
          amount_idr: idrAmount.toFixed(2)
        }));
      }
    }
  }, [formData.lc_amount, formData.exchange_rate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.lc_number.trim()) {
      newErrors.lc_number = 'Nomor LC wajib diisi';
    }

    if (!formData.applicant.trim()) {
      newErrors.applicant = 'Applicant wajib diisi';
    }

    if (!formData.beneficiary.trim()) {
      newErrors.beneficiary = 'Beneficiary wajib diisi';
    }

    if (!formData.lc_amount || parseFloat(formData.lc_amount) <= 0) {
      newErrors.lc_amount = 'Nilai LC harus lebih dari 0';
    }

    if (!formData.exchange_rate || parseFloat(formData.exchange_rate) <= 0) {
      newErrors.exchange_rate = 'Kurs pertukaran harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only proceed if this is an intentional save
    if (!isIntentionalSave) {
      console.log('Form submission blocked - not intentional save');
      return;
    }
    
    if (!validateForm()) {
      setIsIntentionalSave(false);
      return;
    }

    setLoading(true);
    try {
      const lcData = {
        lc_number: formData.lc_number,
        issuing_bank: formData.issuing_bank,
        advising_bank: formData.advising_bank,
        applicant: formData.applicant,
        beneficiary: formData.beneficiary,
        lc_amount: parseFloat(formData.lc_amount),
        lc_currency: formData.lc_currency,
        exchange_rate: parseFloat(formData.exchange_rate),
        amount_idr: parseFloat(formData.amount_idr),
        issue_date: formData.issue_date ? format(formData.issue_date, 'yyyy-MM-dd') : undefined,
        expiry_date: formData.expiry_date ? format(formData.expiry_date, 'yyyy-MM-dd') : undefined,
        shipment_deadline: formData.shipment_deadline ? format(formData.shipment_deadline, 'yyyy-MM-dd') : undefined,
        negotiation_deadline: formData.negotiation_deadline ? format(formData.negotiation_deadline, 'yyyy-MM-dd') : undefined,
        status: formData.status,
        lc_type: formData.lc_type,
        payment_terms: formData.payment_terms
      };

      if (lc) {
        await lcService.updateLC(lc.id, lcData);
      } else {
        await lcService.createLC(lcData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving LC:', error);
      alert('Terjadi kesalahan saat menyimpan data LC');
    } finally {
      setLoading(false);
      setIsIntentionalSave(false);
    }
  };

  const handleIntentionalSubmit = () => {
    setIsIntentionalSave(true);
    // Trigger form submission
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const formatDateForDisplay = (date: Date | null) => {
    return date ? format(date, 'dd/MM/yyyy', { locale: id }) : 'Pilih tanggal';
  };

  return (
    <div className="bg-white p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">Informasi Dasar</h3>
          
          <div>
            <Label htmlFor="lc_number" className="font-medium text-gray-900">Nomor LC *</Label>
            <Input
              id="lc_number"
              value={formData.lc_number}
              onChange={(e) => setFormData(prev => ({ ...prev, lc_number: e.target.value }))}
              placeholder="Masukkan nomor LC"
              className={errors.lc_number ? 'border-red-500' : ''}
            />
            {errors.lc_number && (
              <p className="text-sm text-red-500 mt-1">{errors.lc_number}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lc_type" className="font-medium text-gray-900">Jenis LC</Label>
            <Select value={formData.lc_type} onValueChange={(value) => setFormData(prev => ({ ...prev, lc_type: value as LetterOfCredit['lc_type'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis LC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sight">Sight</SelectItem>
                <SelectItem value="Usance">Usance</SelectItem>
                <SelectItem value="Revolving">Revolving</SelectItem>
                <SelectItem value="Standby">Standby</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status" className="font-medium text-gray-900">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as LetterOfCredit['status'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Amended">Amended</SelectItem>
                <SelectItem value="Utilized">Utilized</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="applicant" className="font-medium text-gray-900">Applicant *</Label>
            <Input
              id="applicant"
              value={formData.applicant}
              onChange={(e) => setFormData(prev => ({ ...prev, applicant: e.target.value }))}
              placeholder="Nama applicant"
              className={errors.applicant ? 'border-red-500' : ''}
            />
            {errors.applicant && (
              <p className="text-sm text-red-500 mt-1">{errors.applicant}</p>
            )}
          </div>

          <div>
            <Label htmlFor="beneficiary" className="font-medium text-gray-900">Beneficiary *</Label>
            <Input
              id="beneficiary"
              value={formData.beneficiary}
              onChange={(e) => setFormData(prev => ({ ...prev, beneficiary: e.target.value }))}
              placeholder="Nama beneficiary"
              className={errors.beneficiary ? 'border-red-500' : ''}
            />
            {errors.beneficiary && (
              <p className="text-sm text-red-500 mt-1">{errors.beneficiary}</p>
            )}
          </div>
        </div>

        {/* Bank Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">Informasi Bank</h3>
          
          <div>
            <Label htmlFor="issuing_bank" className="font-medium text-gray-900">Issuing Bank</Label>
            <Input
              id="issuing_bank"
              value={formData.issuing_bank}
              onChange={(e) => setFormData(prev => ({ ...prev, issuing_bank: e.target.value }))}
              placeholder="Nama bank penerbit"
            />
          </div>

          <div>
            <Label htmlFor="advising_bank" className="font-medium text-gray-900">Advising Bank</Label>
            <Input
              id="advising_bank"
              value={formData.advising_bank}
              onChange={(e) => setFormData(prev => ({ ...prev, advising_bank: e.target.value }))}
              placeholder="Nama bank penerus"
            />
          </div>

          <div>
            <Label htmlFor="payment_terms" className="font-medium text-gray-900">Syarat Pembayaran</Label>
            <Textarea
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
              placeholder="Masukkan syarat pembayaran dan ketentuan lainnya..."
              rows={8}
            />
          </div>
        </div>

        {/* Kolom 3: Informasi Finansial */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">Informasi Finansial</h3>
          
          <div>
            <Label htmlFor="lc_amount" className="font-medium text-gray-900">Nilai LC *</Label>
            <Input
              id="lc_amount"
              type="number"
              step="0.01"
              value={formData.lc_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, lc_amount: e.target.value }))}
              placeholder="0.00"
              className={errors.lc_amount ? 'border-red-500' : ''}
            />
            {errors.lc_amount && (
              <p className="text-sm text-red-500 mt-1">{errors.lc_amount}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="lc_currency" className="font-medium text-gray-900">Mata Uang</Label>
            <Select value={formData.lc_currency} onValueChange={(value) => setFormData(prev => ({ ...prev, lc_currency: value }))}>
              <SelectTrigger>
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
            <Label htmlFor="exchange_rate" className="font-medium text-gray-900">Kurs Pertukaran (ke IDR) *</Label>
            <Input
              id="exchange_rate"
              type="number"
              step="0.000001"
              value={formData.exchange_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: e.target.value }))}
              placeholder="0.000000"
              className={errors.exchange_rate ? 'border-red-500' : ''}
            />
            {errors.exchange_rate && (
              <p className="text-sm text-red-500 mt-1">{errors.exchange_rate}</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount_idr" className="font-medium text-gray-900">Nilai dalam IDR</Label>
            <Input
              id="amount_idr"
              type="number"
              step="0.01"
              value={formData.amount_idr}
              onChange={(e) => setFormData(prev => ({ ...prev, amount_idr: e.target.value }))}
              placeholder="0.00"
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500 mt-1">Dihitung otomatis dari nilai LC × kurs</p>
          </div>
        </div>

        {/* Kolom 4: Tanggal Penting */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">Tanggal Penting</h3>
          
          <div>
            <Label className="font-medium text-gray-900">Tanggal Penerbitan</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm",
                    !formData.issue_date && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateForDisplay(formData.issue_date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="end">
                <Calendar
                  mode="single"
                  selected={formData.issue_date || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, issue_date: date || null }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="font-medium text-gray-900">Tanggal Expiry</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm",
                    !formData.expiry_date && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateForDisplay(formData.expiry_date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="end">
                <Calendar
                  mode="single"
                  selected={formData.expiry_date || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, expiry_date: date || null }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="font-medium text-gray-900">Batas Pengiriman</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm",
                    !formData.shipment_deadline && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateForDisplay(formData.shipment_deadline)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="end">
                <Calendar
                  mode="single"
                  selected={formData.shipment_deadline || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, shipment_deadline: date || null }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="font-medium text-gray-900">Batas Negosiasi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm",
                    !formData.negotiation_deadline && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateForDisplay(formData.negotiation_deadline)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] sm:w-[320px] p-0" align="end">
                <Calendar
                  mode="single"
                  selected={formData.negotiation_deadline || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, negotiation_deadline: date || null }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="button" onClick={handleIntentionalSubmit} disabled={loading}>
          {loading ? 'Menyimpan...' : (lc ? 'Update LC' : 'Simpan LC')}
        </Button>
      </div>
      </form>
    </div>
  );
};

export default LCForm;