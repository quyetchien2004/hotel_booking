(function () {
  const form = document.getElementById('searchForm');
  const rentalModeEl = document.getElementById('rentalMode');
  const hourlyFields = document.getElementById('hourlyFields');
  const dailyFields = document.getElementById('dailyFields');
  const useLocationBtn = document.getElementById('useLocationBtn');
  const resetSearchBtn = document.getElementById('resetSearchBtn');
  const searchBtn = document.getElementById('searchBtn');
  const statusBar = document.getElementById('statusBar');
  const branchResults = document.getElementById('branchResults');
  const bookingAlert = document.getElementById('bookingAlert');
  const mapElement = document.getElementById('branchMap');
  const resultCountEl = document.getElementById('resultCount');
  const roomCountEl = document.getElementById('roomCount');
  const bestPriceEl = document.getElementById('bestPrice');
  const selectedRoomIdEl = document.getElementById('selectedRoomId');
  const selectedRoomLabelEl = document.getElementById('selectedRoomLabel');
  const customerFullNameEl = document.getElementById('customerFullName');
  const paymentOptionEl = document.getElementById('paymentOption');
  const confirmBookingBtn = document.getElementById('confirmBookingBtn');
  const roomContextById = {};
  const ROOM_DETAIL_BASE = '/img/rooms-details/';
  const ROOM_IMAGE_GROUPS = {
    '2_standard': ['2_nguoi.jpg', '2_nguoi(2).jpg'],
    '2_luxury': ['2_nguoi_luxury.jpg'],
    '2_luxury_ban_cong': ['2_nguoi_luxury_ban_cong.png'],
    '4_standard': ['4_nguoi.jpg', '4_nguoi(2).jpg'],
    '4_luxury': ['4_nguoi_luxury.jpg', '4_nguoi_luxury(2).jpg'],
    '4_luxury_ban_cong': ['4_nguoi_luxury_ban_cong.jpg'],
    '6_standard': ['6_nguoi.jpg'],
    '6_luxury': ['6_nguoi_luxury.jpg'],
    '6_luxury_ban_cong': ['6_nguoi_luxury_ban_cong.jpg'],
    '10_standard': ['10_nguoi.jpg'],
    '10_luxury': ['10_nguoi_luxury.jpg'],
    '10_luxury_ban_cong': ['10_nguoi_luxury_ban_cong.jpg']
  };
  const ROOM_IMAGE_COUNTERS = {};

  const map = window.L ? L.map(mapElement).setView([16.5, 107.5], 6) : null;
  const bookingModal = window.bootstrap ? new bootstrap.Modal(document.getElementById('bookingModal')) : null;
  let markers = [];

  if (map) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }

  let lastSearchPayload = null;
  const ROOMS_PER_PAGE = 9;
  const roomPaginationState = {
    items: [],
    currentPage: 1,
    totalPages: 1,
    branchCount: 0,
    capacityStats: {}
  };

  function formatCurrency(vnd) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd);
  }

  function setStatus(msg, type) {
    statusBar.className = 'status-bar';
    if (type) {
      statusBar.classList.add(type);
    }
    statusBar.textContent = msg;
  }

  function setSummary(branchCount, roomCount, minPrice) {
    if (resultCountEl) {
      resultCountEl.textContent = String(branchCount);
    }
    if (roomCountEl) {
      roomCountEl.textContent = String(roomCount);
    }
    if (bestPriceEl) {
      bestPriceEl.textContent = minPrice == null ? '-' : formatCurrency(minPrice);
    }
  }

  function toggleModeFields() {
    const mode = rentalModeEl.value;
    hourlyFields.style.display = mode === 'HOURLY' ? 'flex' : 'none';
    dailyFields.style.display = mode === 'DAILY' ? 'flex' : 'none';
  }

  function collectPayload() {
    const payload = {
      province: document.getElementById('province').value.trim(),
      rentalMode: rentalModeEl.value,
      maxPrice: document.getElementById('maxPrice').value.trim(),
      voucherCode: document.getElementById('voucherCode').value.trim(),
      userLatitude: document.getElementById('userLatitude').value.trim(),
      userLongitude: document.getElementById('userLongitude').value.trim()
    };

    if (payload.rentalMode === 'HOURLY') {
      payload.startDateTime = document.getElementById('startDateTime').value;
      payload.endDateTime = document.getElementById('endDateTime').value;
    } else {
      payload.startDate = document.getElementById('startDate').value;
      payload.endDate = document.getElementById('endDate').value;
    }

    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') {
        delete payload[k];
      }
    });

    return payload;
  }

  function toQueryString(payload) {
    const qs = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => qs.append(k, v));
    return qs.toString();
  }

  async function readApiResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      return await res.json();
    }

    const raw = await res.text();
    return {
      error: raw && raw.trim().startsWith('<')
        ? 'Phiên đăng nhập hết hạn hoặc bạn chưa đăng nhập'
        : (raw || 'Không nhận được phản hồi hợp lệ từ máy chủ')
    };
  }

  function hasRequiredSearchFields(payload) {
    if (!payload || !payload.rentalMode) {
      return false;
    }
    if (payload.rentalMode === 'HOURLY') {
      return Boolean(payload.startDateTime && payload.endDateTime);
    }
    return Boolean(payload.startDate && payload.endDate);
  }

  function roomTypeText(roomType) {
    switch (roomType) {
      case 'SINGLE': return 'Phòng đơn';
      case 'DOUBLE': return 'Phòng đôi';
      case 'TRIPLE': return 'Phòng 3 người';
      case 'FAMILY': return 'Phòng gia đình';
      default: return roomType;
    }
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getAuthHeaders(extraHeaders) {
    const headers = Object.assign({}, extraHeaders || {});
    const token = window.localStorage ? window.localStorage.getItem('accessToken') : '';
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }
    return headers;
  }

  function normalizeCapacity(capacity) {
    const cap = toNumber(capacity);
    const supported = [2, 4, 6, 10];
    if (supported.includes(cap)) {
      return cap;
    }
    // If backend returns 1/3/... map to nearest configured photo group
    return supported.reduce((best, cur) => {
      return Math.abs(cur - cap) < Math.abs(best - cap) ? cur : best;
    }, supported[0]);
  }

  function buildCapacityDailyStats(branches) {
    const grouped = {};
    (branches || []).forEach((branch) => {
      (branch.availableRooms || []).forEach((room) => {
        const cap = normalizeCapacity(room.capacity);
        if (!grouped[cap]) {
          grouped[cap] = [];
        }
        const daily = toNumber(room.dailyRate);
        if (daily > 0) {
          grouped[cap].push(daily);
        }
      });
    });

    const stats = {};
    Object.keys(grouped).forEach((capKey) => {
      const values = grouped[capKey].slice().sort((a, b) => a - b);
      if (values.length === 0) {
        stats[capKey] = 0;
        return;
      }
      const middle = Math.floor(values.length / 2);
      const median = values.length % 2 === 0
        ? (values[middle - 1] + values[middle]) / 2
        : values[middle];
      stats[capKey] = median;
    });
    return stats;
  }

  function inferRoomImageKey(room, capacityStats) {
    const cap = normalizeCapacity(room.capacity);
    const capMedian = capacityStats[String(cap)] || 0;
    const dailyRate = toNumber(room.dailyRate);
    // Suy luận "luxury" từ mức giá tương đối trong cùng nhóm sức chứa
    const isLuxury = capMedian > 0 && dailyRate >= capMedian * 1.12;
    const hasBalconyView = Boolean(room.hasNiceView);

    if (isLuxury && hasBalconyView) {
      return cap + '_luxury_ban_cong';
    }
    if (isLuxury) {
      return cap + '_luxury';
    }
    // Nếu chỉ có view đẹp, ưu tiên ảnh balcony cùng nhóm để đúng ý nghĩa minh họa
    if (hasBalconyView && ROOM_IMAGE_GROUPS[cap + '_luxury_ban_cong']) {
      return cap + '_luxury_ban_cong';
    }
    return cap + '_standard';
  }

  function resolveRoomImage(room, capacityStats) {
    const imageKey = inferRoomImageKey(room, capacityStats);
    const files = ROOM_IMAGE_GROUPS[imageKey] || [];
    if (!files.length) {
      return ROOM_DETAIL_BASE + 'CCT_floor.jpg';
    }

    const usedCount = ROOM_IMAGE_COUNTERS[imageKey] || 0;
    ROOM_IMAGE_COUNTERS[imageKey] = usedCount + 1;
    const picked = files[usedCount % files.length];
    return ROOM_DETAIL_BASE + picked;
  }

  function flattenRoomsWithBranch(data) {
    const flattened = [];
    (data || []).forEach((branch) => {
      (branch.availableRooms || []).forEach((room) => {
        flattened.push({ room, branch });
      });
    });
    return flattened;
  }

  function buildPaginationHtml(totalPages, currentPage) {
    if (totalPages <= 1) {
      return '';
    }

    const buttons = [];
    for (let page = 1; page <= totalPages; page++) {
      buttons.push(
        '<button type="button" class="room-page-btn ' + (page === currentPage ? 'active' : '')
        + ' js-room-page" data-page="' + page + '">' + page + '</button>'
      );
    }

    return '<div class="room-pagination">' + buttons.join('') + '</div>';
  }

  function createRoomCardHtml(item, capacityStats) {
    const room = item.room;
    const branch = item.branch;
    const roomImage = resolveRoomImage(room, capacityStats);

    return '<div class="room-item">'
      + '<div class="room-item-media">'
      + '<img src="' + roomImage + '" alt="Ảnh minh họa phòng ' + room.roomNumber + '" loading="lazy" />'
      + '</div>'
      + '<div class="d-flex justify-content-between align-items-start flex-wrap">'
      + '<div>'
      + '<h4>Phòng ' + room.roomNumber + ' - Tầng ' + room.floorNumber + '</h4>'
      + '<div class="room-meta">' + roomTypeText(room.roomType) + ' • ' + room.capacity + ' khách</div>'
      + '<div class="room-meta" style="margin-top:-6px;">' + branch.branchName + ' (' + branch.province + ')</div>'
      + '</div>'
      + '<div>'
      + '<span class="price-chip">Tạm tính: ' + formatCurrency(room.estimatedPrice) + '</span>'
      + (room.hasNiceView ? '<span class="badge-view">View đẹp</span>' : '')
      + '</div>'
      + '</div>'
      + '<div class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2 mt-auto">'
      + '<small>Giá giờ: ' + formatCurrency(room.hourlyRate) + ' | Giá ngày: ' + formatCurrency(room.dailyRate) + '</small>'
      + '<button type="button" class="btn btn-brand btn-sm js-book-room" data-room-id="' + room.roomId + '">Đặt phòng ngay</button>'
      + '</div>'
      + '</div>';
  }

  function renderRoomPage(page) {
    if (!roomPaginationState.items.length) {
      branchResults.innerHTML = '<div class="note-card">Không tìm thấy phòng phù hợp với bộ lọc hiện tại.</div>';
      return;
    }

    const safePage = Math.max(1, Math.min(page, roomPaginationState.totalPages));
    roomPaginationState.currentPage = safePage;

    const start = (safePage - 1) * ROOMS_PER_PAGE;
    const pageItems = roomPaginationState.items.slice(start, start + ROOMS_PER_PAGE);
    const roomsHtml = pageItems
      .map((item) => createRoomCardHtml(item, roomPaginationState.capacityStats))
      .join('');
    const paginationHtml = buildPaginationHtml(roomPaginationState.totalPages, safePage);

    branchResults.innerHTML = '<div class="note-card" style="margin-top:0;">'
      + 'Hiển thị ' + pageItems.length + ' phòng trên trang ' + safePage + '/' + roomPaginationState.totalPages
      + ' • Tổng cộng ' + roomPaginationState.items.length + ' phòng trống từ ' + roomPaginationState.branchCount + ' chi nhánh.'
      + '</div>'
      + '<div class="room-list room-list--paged mt-2">' + roomsHtml + '</div>'
      + paginationHtml;
  }

  function renderResults(data) {
    Object.keys(roomContextById).forEach((k) => delete roomContextById[k]);
    Object.keys(ROOM_IMAGE_COUNTERS).forEach((k) => delete ROOM_IMAGE_COUNTERS[k]);

    if (!Array.isArray(data) || data.length === 0) {
      if (map) {
        markers.forEach((m) => map.removeLayer(m));
        markers = [];
      }
      branchResults.innerHTML = '<div class="note-card">Không tìm thấy phòng phù hợp với bộ lọc hiện tại.</div>';
      setSummary(0, 0, null);
      return;
    }

    renderMapMarkers(data);
    let roomCount = 0;
    let minPrice = null;
    const capacityStats = buildCapacityDailyStats(data);
    const flattenedRooms = flattenRoomsWithBranch(data);

    flattenedRooms.forEach((item) => {
      const room = item.room;
      roomCount += 1;
      if (room.estimatedPrice != null && (minPrice == null || room.estimatedPrice < minPrice)) {
        minPrice = room.estimatedPrice;
      }
      roomContextById[String(room.roomId)] = {
        roomNumber: room.roomNumber,
        floorNumber: room.floorNumber,
        branchName: item.branch.branchName
      };
    });

    roomPaginationState.items = flattenedRooms;
    roomPaginationState.branchCount = data.length;
    roomPaginationState.totalPages = Math.max(1, Math.ceil(flattenedRooms.length / ROOMS_PER_PAGE));
    roomPaginationState.currentPage = 1;
    roomPaginationState.capacityStats = capacityStats;

    renderRoomPage(1);
    setSummary(data.length, roomCount, minPrice);
  }

  function renderMapMarkers(data) {
    if (!map) {
      return;
    }

    markers.forEach((m) => map.removeLayer(m));
    markers = [];

    const points = [];
    data.forEach((branch) => {
      if (branch.latitude == null || branch.longitude == null) {
        return;
      }
      const marker = L.marker([branch.latitude, branch.longitude]).addTo(map);
      marker.bindPopup('<strong>' + branch.branchName + '</strong><br/>' + branch.address + '<br/>' + branch.province);
      markers.push(marker);
      points.push([branch.latitude, branch.longitude]);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds.pad(0.2));
    }
  }

  async function searchRooms(evt) {
    evt.preventDefault();
    bookingAlert.innerHTML = '';

    const payload = collectPayload();
    lastSearchPayload = payload;
    setStatus('Đang tìm phòng phù hợp...', 'warn');
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.textContent = 'Đang tìm...';
    }

    try {
      const res = await fetch('/api/hotels/search?' + toQueryString(payload));
      const data = await readApiResponse(res);
      if (!res.ok) {
        throw new Error(data && (data.error || data.message) ? (data.error || data.message) : 'Không thể tìm phòng');
      }
      renderResults(data);
      setStatus('Tìm thấy ' + data.length + ' chi nhánh phù hợp.', 'ok');
    } catch (err) {
      branchResults.innerHTML = '';
      setStatus('Lỗi tìm kiếm: ' + err.message, 'danger');
      setSummary(0, 0, null);
    } finally {
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Tìm phòng trống ngay';
      }
    }
  }

  function resetSearchForm() {
    form.reset();
    toggleModeFields();
    branchResults.innerHTML = '<div class="note-card">Nhập bộ lọc và bấm Tìm phòng trống ngay để hiển thị kết quả.</div>';
    bookingAlert.innerHTML = '';
    setSummary(0, 0, null);
    setStatus('Đã đặt lại bộ lọc. Sẵn sàng tìm phòng.', 'ok');
    lastSearchPayload = null;
    roomPaginationState.items = [];
    roomPaginationState.currentPage = 1;
    roomPaginationState.totalPages = 1;
    roomPaginationState.branchCount = 0;
    roomPaginationState.capacityStats = {};

    if (map) {
      markers.forEach((m) => map.removeLayer(m));
      markers = [];
      map.setView([16.5, 107.5], 6);
    }
  }

  function bookRoom(roomId, roomNumber, floorNumber, branchName) {
    if (!lastSearchPayload) {
      const recoveredPayload = collectPayload();
      if (hasRequiredSearchFields(recoveredPayload)) {
        lastSearchPayload = recoveredPayload;
      } else {
        bookingAlert.innerHTML = '<div class="alert-inline warn">Hãy tìm phòng trước khi đặt.</div>';
        return;
      }
    }

    selectedRoomIdEl.value = roomId;
    selectedRoomLabelEl.textContent = 'Chi nhánh: ' + branchName + ' | Phong ' + roomNumber + ' - Tầng ' + floorNumber;
    customerFullNameEl.value = '';

    if (!bookingModal) {
      bookingAlert.innerHTML = '<div class="alert-inline warn">Không mở được hộp thoại đặt phòng. Hãy tải lại trang và thử lại.</div>';
      return;
    }

    bookingModal.show();
  }

  function handleBranchResultsClick(evt) {
    const pageBtn = evt.target.closest('.js-room-page');
    if (pageBtn) {
      const page = Number(pageBtn.dataset.page || 1);
      renderRoomPage(page);
      window.scrollTo({ top: branchResults.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
      return;
    }

    const btn = evt.target.closest('.js-book-room');
    if (!btn) {
      return;
    }

    const roomId = String(btn.dataset.roomId || '').trim();
    const roomCtx = roomContextById[String(roomId)];

    if (!roomCtx) {
      bookingAlert.innerHTML = '<div class="alert-inline warn">Không lấy được thông tin phòng đã chọn. Hãy tìm phòng lại.</div>';
      return;
    }

    bookRoom(roomId, roomCtx.roomNumber, roomCtx.floorNumber, roomCtx.branchName || '');
  }

  async function submitBooking() {
    const roomId = String(selectedRoomIdEl.value || '').trim();
    const customerFullName = customerFullNameEl.value;
    const paymentOption = paymentOptionEl ? paymentOptionEl.value : 'DEPOSIT_30';

    if (!lastSearchPayload || !hasRequiredSearchFields(lastSearchPayload)) {
      bookingAlert.innerHTML = '<div class="alert-inline warn">Thông tin tìm kiếm không hợp lệ. Hãy tìm phòng lại trước khi đặt.</div>';
      return;
    }

    if (!roomId) {
      bookingAlert.innerHTML = '<div class="alert-inline warn">Chưa chọn phòng hợp lệ.</div>';
      return;
    }

    if (!customerFullName || !customerFullName.trim()) {
      customerFullNameEl.focus();
      return;
    }

    const bookingPayload = {
      roomId: roomId,
      rentalMode: lastSearchPayload.rentalMode,
      customerFullName: customerFullName.trim(),
      voucherCode: lastSearchPayload.voucherCode,
      paymentOption: paymentOption
    };

    if (lastSearchPayload.rentalMode === 'HOURLY') {
      bookingPayload.startDateTime = lastSearchPayload.startDateTime;
      bookingPayload.endDateTime = lastSearchPayload.endDateTime;
    } else {
      bookingPayload.startDate = lastSearchPayload.startDate;
      bookingPayload.endDate = lastSearchPayload.endDate;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(bookingPayload)
      });

      const data = await readApiResponse(res);

      if (res.redirected || (res.url && res.url.includes('/login'))) {
        bookingAlert.innerHTML = '<div class="alert-inline warn">Bạn cần đăng nhập để đặt phòng. <a href="/login">Đăng nhập ngay</a>.</div>';
        return;
      }

      if (res.status === 401 || res.status === 403) {
        bookingAlert.innerHTML = '<div class="alert-inline warn">Bạn cần đăng nhập để đặt phòng. <a href="/login">Đăng nhập ngay</a>.</div>';
        return;
      }

      if (!res.ok) {
        throw new Error(data && (data.error || data.message) ? (data.error || data.message) : 'Đặt phòng thất bại');
      }

      bookingAlert.innerHTML = '<div class="alert-inline ok">Khởi tạo đặt phòng thành công! Mã booking #' + data.bookingId + '. Đang chuyển sang VNPAY để thanh toán.</div>';
      if (bookingModal) {
        bookingModal.hide();
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      bookingAlert.innerHTML = '<div class="alert-inline danger">Đặt phòng thất bại: ' + err.message + '</div>';
    }
  }

  rentalModeEl.addEventListener('change', toggleModeFields);
  form.addEventListener('submit', searchRooms);
  branchResults.addEventListener('click', handleBranchResultsClick);
  confirmBookingBtn.addEventListener('click', submitBooking);
  if (resetSearchBtn) {
    resetSearchBtn.addEventListener('click', resetSearchForm);
  }

  useLocationBtn.addEventListener('click', function () {
    if (!navigator.geolocation) {
      setStatus('Trình duyệt không hỗ trợ lấy vị trí.', 'warn');
      return;
    }

    navigator.geolocation.getCurrentPosition(function (pos) {
      document.getElementById('userLatitude').value = pos.coords.latitude.toFixed(6);
      document.getElementById('userLongitude').value = pos.coords.longitude.toFixed(6);
      setStatus('Đã lấy vị trí hiện tại.', 'ok');
    }, function () {
      setStatus('Không lấy được vị trí. Bạn có thể nhập tay.', 'warn');
    });
  });

  toggleModeFields();
  setSummary(0, 0, null);
})();


