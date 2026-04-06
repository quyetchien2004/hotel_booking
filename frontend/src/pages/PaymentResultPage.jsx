import { Link, useSearchParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';

function fmt(n) {
  if (n == null || n === '') return '-';
  return Number(n).toLocaleString('vi-VN') + ' VND';
}

export default function PaymentResultPage() {
  const [params] = useSearchParams();

  const bookingId = params.get('bookingId');
  const paymentStatus = params.get('paymentStatus') || params.get('status');
  const workflowStatus = params.get('workflowStatus') || params.get('status');
  const totalPrice = params.get('totalPrice');
  const requiredPaymentAmount = params.get('requiredPaymentAmount');
  const paidAmount = params.get('paidAmount');
  const invoiceNumber = params.get('invoiceNumber');

  const isSuccess = paymentStatus === 'SUCCESS';
  const isPending = paymentStatus === 'PENDING';
  const isCancelled = paymentStatus === 'CANCELLED';
  const isLoyalPending = isPending && workflowStatus === 'APPROVED';

  const statusBadgeCls = isSuccess ? 'bg-success' : isCancelled ? 'bg-danger' : 'bg-warning text-dark';
  const statusDesc = isSuccess
    ? 'Thanh toán thành công, đơn đặt phòng đã được xác nhận.'
    : isLoyalPending
    ? 'Booking khách thân thiết đã được xác nhận. Hóa đơn đang ở trạng thái pending và chưa cần thanh toán trước.'
    : isPending
    ? 'Đã thanh toán cọc. Đơn đang chờ admin duyệt.'
    : 'Thanh toán không thành công hoặc đã bị hủy.';

  return (
    <SiteLayout activePage="my-bookings" headerVariant="light">
      <div className="container py-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="fs-1">
                {isSuccess && <i className="fa-solid fa-circle-check text-success" />}
                {isPending && <i className="fa-solid fa-circle-pause text-warning" />}
                {isCancelled && <i className="fa-solid fa-circle-xmark text-danger" />}
                {!isSuccess && !isPending && !isCancelled && <i className="fa-solid fa-circle-info text-secondary" />}
              </div>
              <div>
                <h2 className="mb-1">Kết quả thanh toán VNPAY</h2>
                <p className="mb-0 text-muted">{statusDesc}</p>
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="small text-muted">Mã đơn</div>
                  <div className="fw-semibold">{bookingId ? `#${bookingId}` : '-'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="small text-muted">Trạng thái</div>
                  <span className={`badge rounded-pill ${statusBadgeCls}`}>{paymentStatus || '-'}</span>
                  <div className="mt-2 text-muted small">{workflowStatus || '-'}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 border rounded-3 bg-light h-100">
                  <div className="small text-muted">Tổng giá trị đơn</div>
                  <div className="fw-semibold">{fmt(totalPrice)}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 border rounded-3 bg-light h-100">
                  <div className="small text-muted">Cần thanh toán</div>
                  <div className="fw-semibold">{fmt(requiredPaymentAmount)}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 border rounded-3 bg-light h-100">
                  <div className="small text-muted">Đã thanh toán</div>
                  <div className="fw-semibold">{fmt(paidAmount)}</div>
                </div>
              </div>
              <div className="col-12">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="small text-muted">Số hóa đơn</div>
                  <div className="fw-semibold">{invoiceNumber || 'Chưa phát hành'}</div>
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <Link className="btn btn-brand" to="/my-bookings">
                <i className="fa-solid fa-receipt me-1" /> Xem đơn của tôi
              </Link>
              {bookingId && (
                <Link className="btn btn-outline-primary" to={`/invoice/${encodeURIComponent(invoiceNumber || bookingId)}`}>
                  <i className="fa-solid fa-file-invoice me-1" /> Xem/In hóa đơn
                </Link>
              )}
              <Link className="btn btn-outline-secondary" to="/booking">
                <i className="fa-solid fa-hotel me-1" /> Đặt phòng tiếp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
