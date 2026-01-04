import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { paymentTermsService, PaymentTermsMaster } from '@/lib/supabase';

interface PaymentTermsFormProps {
  term?: PaymentTermsMaster | null;
  onSave: () => void;
  onCancel: () => void;
}

const PaymentTermsForm: React.FC<PaymentTermsFormProps> = ({ term, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    term_code: term?.term_code || '',
    term_name: term?.term_name || '',
    term_description: term?.term_description || '',
    term_type: term?.term_type || 'NET' as const,
    days_to_pay: term?.days_to_pay || 0,
    percentage: term?.percentage || 100,
    is_active: term?.is_active ?? true,
    is_default: term?.is_default ?? false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.term_code.trim()) {
        throw new Error('Term code wajib diisi');
      }
      if (!formData.term_name.trim()) {
        throw new Error('Term name wajib diisi');
      }
      if (formData.days_to_pay < 0) {
        throw new Error('Days to pay tidak boleh negatif');
      }
      if (formData.percentage < 0 || formData.percentage > 100) {
        throw new Error('Percentage harus antara 0-100');
      }

      // Set percentage to 100 for most term types
      let finalData = { ...formData };
      if (formData.term_type !== 'DP') {
        finalData.percentage = 100;
      }

      if (term) {
        await paymentTermsService.updatePaymentTerm(term.id, finalData);
      } else {
        await paymentTermsService.createPaymentTerm(finalData);
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateTermCode = () => {
    const { term_type, days_to_pay, percentage } = formData;
    let code = '';
    
    switch (term_type) {
      case 'DP':
        code = `DP_${percentage}`;
        break;
      case 'COD':
        code = 'COD';
        break;
      case 'NET':
        code = `NET_${days_to_pay}`;
        break;
      case 'LC':
        code = days_to_pay > 0 ? `LC_${days_to_pay}` : 'LC_SIGHT';
        break;
      case 'CUSTOM':
        code = `CUSTOM_${days_to_pay}`;
        break;
      default:
        code = 'CUSTOM';
    }
    
    handleInputChange('term_code', code);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="term_type">Jenis Payment Term *</Label>
            <Select
              value={formData.term_type}
              onValueChange={(value) => handleInputChange('term_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis payment term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DP">Down Payment (DP)</SelectItem>
                <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
                <SelectItem value="NET">Net Days</SelectItem>
                <SelectItem value="LC">Letter of Credit (L/C)</SelectItem>
                <SelectItem value="CUSTOM">Custom Terms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="term_name">Nama Term *</Label>
            <Input
              id="term_name"
              type="text"
              value={formData.term_name}
              onChange={(e) => handleInputChange('term_name', e.target.value)}
              placeholder="e.g., Net 30 Days"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="term_code">Kode Term *</Label>
              <Input
                id="term_code"
                type="text"
                value={formData.term_code}
                onChange={(e) => handleInputChange('term_code', e.target.value)}
                placeholder="e.g., NET_30"
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={generateTermCode}
                className="whitespace-nowrap"
              >
                Auto Generate
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="term_description">Deskripsi</Label>
            <Textarea
              id="term_description"
              value={formData.term_description}
              onChange={(e) => handleInputChange('term_description', e.target.value)}
              placeholder="Deskripsi detail payment term"
              rows={3}
            />
          </div>
        </div>

        {/* Terms Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="days_to_pay">Jumlah Hari Pembayaran</Label>
            <Input
              id="days_to_pay"
              type="number"
              min="0"
              value={formData.days_to_pay}
              onChange={(e) => handleInputChange('days_to_pay', parseInt(e.target.value) || 0)}
              placeholder="0 untuk pembayaran langsung"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = pembayaran langsung, &gt;0 = hari setelah invoice date
            </p>
          </div>

          {formData.term_type === 'DP' && (
            <div>
              <Label htmlFor="percentage">Persentase Down Payment (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="1"
                max="100"
                value={formData.percentage}
                onChange={(e) => handleInputChange('percentage', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Persentase dari total invoice yang harus dibayar sebagai DP
              </p>
            </div>
          )}

          {formData.term_type !== 'DP' && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Untuk jenis term selain DP, persentase otomatis diset ke 100%
                (pembayaran penuh).
              </p>
            </div>
          )}

          {/* Status Switches */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active" className="font-medium">Term Aktif</Label>
                <p className="text-xs text-gray-500">Term ini dapat digunakan dalam invoice</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_default" className="font-medium">Default Term</Label>
                <p className="text-xs text-gray-500">Gunakan sebagai default untuk invoice baru</p>
              </div>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleInputChange('is_default', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Preview Payment Term:</h4>
        <div className="text-sm text-gray-700">
          <p><strong>Kode:</strong> {formData.term_code || 'N/A'}</p>
          <p><strong>Nama:</strong> {formData.term_name || 'N/A'}</p>
          <p><strong>Jenis:</strong> {formData.term_type}</p>
          <p><strong>Pembayaran:</strong> 
            {formData.term_type === 'DP' 
              ? `${formData.percentage}% dalam ${formData.days_to_pay} hari`
              : formData.days_to_pay === 0 
                ? 'Pembayaran langsung (100%)'
                : `Pembayaran penuh dalam ${formData.days_to_pay} hari`
            }
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Menyimpan...' : term ? 'Update Term' : 'Simpan Term'}
        </Button>
      </div>
    </form>
  );
};

export default PaymentTermsForm;