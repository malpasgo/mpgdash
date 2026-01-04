import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  DollarSign,
  CreditCard,
  Plus,
  History,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import {
  paymentTermsService,
  PaymentTracking,
  PaymentTermsMaster,
  Invoice,
  PaymentHistory
} from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentTrackingDetailProps {
  tracking: PaymentTracking;
  invoice?: Invoice;
  paymentTerm?: PaymentTermsMaster;
  onUpdate: () => void;
  onClose: () => void;
}

const PaymentTrackingDetail: React.FC<PaymentTrackingDetailProps> = ({
  tracking,
  invoice,
  paymentTerm,
  onUpdate,
  onClose
}) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: invoice?.currency || 'USD',
    exchange_rate: invoice?.exchange_rate || 1.0000,
    payment_method: 'Bank Transfer' as const,
    reference_number: '',
    bank_account: '',
    received_by: '',
    notes: ''
  });
  const [trackingNotes, setTrackingNotes] = useState(tracking.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentHistory();
  }, [tracking.id]);

  useEffect(() => {
    // Calculate IDR amount when amount or exchange rate changes
    setNewPayment(prev => ({
      ...prev,
      amount_idr: prev.amount * prev.exchange_rate
    }));
  }, [newPayment.amount, newPayment.exchange_rate]);

  const loadPaymentHistory = async () => {
    try {
      const history = await paymentTermsService.getPaymentHistoryByTracking(tracking.id);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (newPayment.amount <= 0) {
        throw new Error('Jumlah pembayaran harus lebih dari 0');
      }
      
      const totalPaid = tracking.paid_amount + newPayment.amount;
      if (totalPaid > tracking.total_amount) {
        throw new Error('Total pembayaran tidak boleh melebihi total invoice');
      }

      // Calculate IDR amount
      const amountIdr = newPayment.amount * newPayment.exchange_rate;

      // Create payment history record
      await paymentTermsService.createPaymentHistory({
        payment_tracking_id: tracking.id,
        invoice_id: tracking.invoice_id,
        ...newPayment,
        amount_idr: amountIdr,
        created_by: 'User'
      });

      // Update tracking with new paid amount
      const newPaidAmount = tracking.paid_amount + newPayment.amount;
      const newPaidAmountIdr = tracking.paid_amount_idr + amountIdr;
      const newRemainingAmount = tracking.total_amount - newPaidAmount;
      const newRemainingAmountIdr = tracking.total_amount_idr - newPaidAmountIdr;
      
      // Determine new status
      let newStatus: PaymentTracking['status'] = 'Partial';
      if (newRemainingAmount <= 0.01) { // Account for floating point precision
        newStatus = 'Completed';
      } else if (newPaidAmount === 0) {
        newStatus = 'Not Started';
      }

      // Check if overdue
      const today = new Date();
      const targetDate = new Date(tracking.target_date || '');
      if (newStatus !== 'Completed' && targetDate < today) {
        newStatus = 'Overdue';
      }

      await paymentTermsService.updatePaymentTracking(tracking.id, {
        paid_amount: newPaidAmount,
        paid_amount_idr: newPaidAmountIdr,
        remaining_amount: newRemainingAmount,
        remaining_amount_idr: newRemainingAmountIdr,
        status: newStatus,
        last_payment_date: newPayment.payment_date,
        actual_date: newStatus === 'Completed' ? newPayment.payment_date : tracking.actual_date
      });

      // Reset form
      setNewPayment({
        payment_date: new Date().toISOString().split('T')[0],
        amount: 0,
        currency: invoice?.currency || 'USD',
        exchange_rate: invoice?.exchange_rate || 1.0000,
        payment_method: 'Bank Transfer',
        reference_number: '',
        bank_account: '',
        received_by: '',
        notes: ''
      });
      setShowAddPayment(false);
      setSuccess('Pembayaran berhasil ditambahkan');
      
      // Reload data
      loadPaymentHistory();
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menambahkan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    try {
      await paymentTermsService.updatePaymentTracking(tracking.id, {
        notes: trackingNotes
      });
      setSuccess('Notes berhasil diupdate');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengupdate notes');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Not Started': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'Partial': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Overdue': { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Not Started'];
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getDaysInfo = () => {
    if (!tracking.target_date) return null;
    
    const today = new Date();
    const target = new Date(tracking.target_date);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (tracking.status === 'Completed') {
      return <span className="text-green-600">Pembayaran selesai</span>;
    } else if (diffDays < 0) {
      return <span className="text-red-600">{Math.abs(diffDays)} hari terlambat</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600">Jatuh tempo hari ini</span>;
    } else if (diffDays <= 7) {
      return <span className="text-orange-600">{diffDays} hari lagi</span>;
    } else {
      return <span className="text-blue-600">{diffDays} hari lagi</span>;
    }
  };

  const progressPercentage = tracking.total_amount > 0 
    ? Math.round((tracking.paid_amount / tracking.total_amount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Invoice & Payment Term Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Invoice Number</Label>
              <p className="font-semibold">{invoice?.invoice_number || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Customer</Label>
              <p>{invoice?.customer_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Invoice Date</Label>
              <p>{invoice?.invoice_date ? formatDate(invoice.invoice_date) : 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Due Date</Label>
              <p>{invoice?.due_date ? formatDate(invoice.due_date) : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Term</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Term Name</Label>
              <p className="font-semibold">{paymentTerm?.term_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Term Code</Label>
              <p>{paymentTerm?.term_code || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Type</Label>
              <p>{paymentTerm?.term_type || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Days to Pay</Label>
              <p>{paymentTerm?.days_to_pay || 0} hari</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              Payment Progress
            </span>
            {getStatusBadge(tracking.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
              <p className="text-lg font-semibold">
                {formatCurrency(tracking.total_amount_idr, 'IDR')}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(tracking.total_amount, tracking.invoice_id ? invoice?.currency || 'USD' : 'USD')}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Paid Amount</Label>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(tracking.paid_amount_idr, 'IDR')}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(tracking.paid_amount, tracking.invoice_id ? invoice?.currency || 'USD' : 'USD')}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Remaining</Label>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(tracking.remaining_amount_idr, 'IDR')}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(tracking.remaining_amount, tracking.invoice_id ? invoice?.currency || 'USD' : 'USD')}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress Pembayaran</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Target & Status Info */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <Label className="text-sm font-medium text-gray-600">Target Date</Label>
              <p>{tracking.target_date ? formatDate(tracking.target_date) : 'N/A'}</p>
            </div>
            <div className="text-right">
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <div>{getDaysInfo()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History & Add Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 text-blue-600 mr-2" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.length > 0 ? (
                paymentHistory.map(payment => (
                  <div key={payment.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(payment.amount_idr, 'IDR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(payment.payment_date)}</p>
                        <p className="text-xs text-gray-500">{payment.payment_method}</p>
                      </div>
                    </div>
                    {payment.reference_number && (
                      <p className="text-xs text-gray-600">Ref: {payment.reference_number}</p>
                    )}
                    {payment.notes && (
                      <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Belum ada pembayaran</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Plus className="h-5 w-5 text-green-600 mr-2" />
                Add Payment
              </span>
              {!showAddPayment && (
                <Button 
                  size="sm" 
                  onClick={() => setShowAddPayment(true)}
                  disabled={tracking.status === 'Completed'}
                >
                  Add Payment
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showAddPayment ? (
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="payment_date">Payment Date *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={newPayment.payment_date}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={tracking.remaining_amount}
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder={`Max: ${tracking.remaining_amount}`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newPayment.currency}
                      onValueChange={(value) => setNewPayment(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="IDR">IDR</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SGD">SGD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="exchange_rate">Exchange Rate</Label>
                    <Input
                      id="exchange_rate"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={newPayment.exchange_rate}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, exchange_rate: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={newPayment.payment_method}
                    onValueChange={(value: any) => setNewPayment(prev => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="LC">L/C</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    type="text"
                    value={newPayment.reference_number}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Transaction reference"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Payment notes"
                    rows={2}
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Amount in IDR:</strong> {formatCurrency(newPayment.amount * newPayment.exchange_rate, 'IDR')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Adding...' : 'Add Payment'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddPayment(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                {tracking.status === 'Completed' ? (
                  <div>
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">Pembayaran sudah selesai</p>
                  </div>
                ) : (
                  <div>
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Klik "Add Payment" untuk menambah pembayaran</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              value={trackingNotes}
              onChange={(e) => setTrackingNotes(e.target.value)}
              placeholder="Add notes about this payment tracking..."
              rows={3}
            />
            <Button onClick={handleUpdateNotes} variant="outline" size="sm">
              Update Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default PaymentTrackingDetail;