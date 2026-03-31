import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function fmtMoney(value) {
  if (value == null) return '-';
  return Number(value).toLocaleString('vi-VN') + ' VND';
}

function fmtDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InvoiceDetailPage() {
  const { user } = useAuth();
  const { invoiceRef } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/bookings/invoice/${encodeURIComponent(invoiceRef || '')}`)
      .then((response) => setInvoice(response.data))
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải chi tiết hóa đơn.'))
      .finally(() => setLoading(false));
  }, [invoiceRef]);

  return (
    <SiteLayout activePage="my-bookings" headerVariant="light">
      <div className="container py-4">
        <style>{`@media print {.no-print{display:none !important;} .invoice-print-card{box-shadow:none !important;border:none !important;} body{background:#fff !important;}}`}</style>
        <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3 no-print">
          <div className="page-head-card mb-0 flex-grow-1">
            <h2 className="mb-1">Chi tiết hóa đơn</h2>
            <p className="text-muted mb-0">Tra cứu theo mã hóa đơn hoặc mã đơn và in trực tiếp từ trình duyệt.</p>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/my-bookings">Quay lại đơn của tôi</Link>
            <button className="btn btn-brand" type="button" onClick={() => window.print()}>
              <i className="fa-solid fa-print me-1" /> In hóa đơn
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && invoice && (
          <div className="card invoice-print-card">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="mb-1">CCT Hotels Company</h3>
                  <div className="text-muted small">Hóa đơn thanh toán đặt phòng</div>
                </div>
                <div className="text-md-end">
                  <div><strong>Số hóa đơn:</strong> {invoice.invoiceNumber || 'Chưa phát hành'}</div>
                  <div><strong>Mã đơn:</strong> #{invoice.bookingId}</div>
                  <div><strong>Ngày phát hành:</strong> {fmtDate(invoice.invoiceIssuedAt || invoice.createdAt)}</div>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 h-100">
                    <h6 className="mb-2">Thông tin khách hàng</h6>
                    <div>Họ tên: <strong>{invoice.customer?.fullName || '-'}</strong></div>
                    <div>Email: {invoice.customer?.email || '-'}</div>
                    <div>SĐT: {invoice.customer?.phone || '-'}</div>
                    <div>Tài khoản: {invoice.customer?.username || '-'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded-3 p-3 h-100">
                    <h6 className="mb-2">Thông tin lưu trú</h6>
                    <div>Chi nhánh: <strong>{invoice.branch?.name || '-'}</strong></div>
                    <div>Địa chỉ: {invoice.branch?.address || '-'}</div>
                    <div>Phòng: {invoice.room?.roomNumber || '-'} ({invoice.room?.roomType || '-'})</div>
                    <div>Thời gian: {fmtDate(invoice.stay?.checkInAt)} - {fmtDate(invoice.stay?.checkOutAt)}</div>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Hạng mục</th>
                      <th className="text-end">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Giá gốc</td>
                      <td className="text-end">{fmtMoney(invoice.payment?.originalPrice)}</td>
                    </tr>
                    <tr>
                      <td>Giảm giá ({invoice.payment?.appliedVoucherCode || 'Không có voucher'})</td>
                      <td className="text-end">-{fmtMoney(invoice.payment?.discountAmount)}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Tổng đơn</td>
                      <td className="text-end fw-semibold">{fmtMoney(invoice.payment?.totalPrice)}</td>
                    </tr>
                    <tr>
                      <td>Cần thanh toán</td>
                      <td className="text-end">{fmtMoney(invoice.payment?.requiredPaymentAmount)}</td>
                    </tr>
                    <tr>
                      <td>Đã thanh toán</td>
                      <td className="text-end">{fmtMoney(invoice.payment?.paidAmount)}</td>
                    </tr>
                    <tr>
                      <td>Trạng thái</td>
                      <td className="text-end">{invoice.paymentStatus} / {invoice.workflowStatus}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-muted small mt-3">
                Hình thức thanh toán: {invoice.payment?.paymentOption || '-'}
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
