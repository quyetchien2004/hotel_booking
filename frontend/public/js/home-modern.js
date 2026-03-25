(function () {
  const form = document.getElementById('homeSearchForm');
  if (!form) {
    return;
  }

  const rentalMode = document.getElementById('rentalMode');
  const dailyFields = document.getElementById('dailyFields');
  const hourlyFields = document.getElementById('hourlyFields');
  const resultBox = document.getElementById('searchResult');
  const goBookingLink = document.getElementById('goBookingLink');
  const searchBtn = document.getElementById('searchBtn');

  function toggleFields() {
    const isHourly = rentalMode.value === 'HOURLY';
    dailyFields.classList.toggle('d-none', isHourly);
    hourlyFields.classList.toggle('d-none', !isHourly);
  }

  function setResult(message, type) {
    resultBox.className = 'search-result';
    if (type) {
      resultBox.classList.add(type);
    }
    resultBox.textContent = message;
  }

  function collectPayload() {
    const payload = {
      province: document.getElementById('province').value.trim(),
      rentalMode: rentalMode.value,
      maxPrice: document.getElementById('maxPrice').value.trim(),
      voucherCode: document.getElementById('voucherCode').value.trim()
    };

    if (payload.rentalMode === 'HOURLY') {
      payload.startDateTime = document.getElementById('startDateTime').value;
      payload.endDateTime = document.getElementById('endDateTime').value;
    } else {
      payload.startDate = document.getElementById('startDate').value;
      payload.endDate = document.getElementById('endDate').value;
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') {
        delete payload[key];
      }
    });

    return payload;
  }

  function toQueryString(payload) {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => params.append(key, value));
    return params.toString();
  }

  function countAvailableRooms(branches) {
    return branches.reduce((total, branch) => total + (branch.availableRooms ? branch.availableRooms.length : 0), 0);
  }

  async function onSearch(event) {
    event.preventDefault();

    const payload = collectPayload();
    const queryString = toQueryString(payload);
    const targetUrl = '/room' + (queryString ? '?' + queryString : '');

    setResult('Dang tim du lieu phong trong...', 'warn');
    searchBtn.disabled = true;

    try {
      const response = await fetch('/api/hotels/search' + (queryString ? '?' + queryString : ''));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data && (data.error || data.message) ? (data.error || data.message) : 'Không thể tải kết quả.');
      }

      const branchCount = data.length;
      const roomCount = countAvailableRooms(data);

      if (branchCount === 0) {
        setResult('Không tìm thấy phòng phù hợp. Bạn có thể đổi bộ lọc và thử lại.', 'warn');
      } else {
        setResult('Tìm thấy ' + branchCount + ' chi nhánh và ' + roomCount + ' phòng trống. Nhấn nút bên dưới để đặt phòng.', 'ok');
      }

      goBookingLink.setAttribute('href', targetUrl);
    } catch (error) {
      setResult('Loi ket noi API: ' + error.message, 'error');
    } finally {
      searchBtn.disabled = false;
    }
  }

  rentalMode.addEventListener('change', toggleFields);
  form.addEventListener('submit', onSearch);

  toggleFields();
})();

