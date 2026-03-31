function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

export function validateLoginPayload(payload) {
  const errors = [];
  const email = normalizeEmail(payload?.email);
  const username = normalizeUsername(payload?.username);
  const identifier = normalizeUsername(payload?.identifier);
  const password = String(payload?.password || '');

  const resolvedIdentifier = identifier || email || username;

  if (!resolvedIdentifier) {
    errors.push('Email hoặc username là bắt buộc');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      identifier: resolvedIdentifier,
      password,
    },
  };
}

export function validateRegisterPayload(payload) {
  const errors = [];
  const fullName = String(payload?.fullName || payload?.name || '').trim();
  const username = normalizeUsername(payload?.username);
  const phone = String(payload?.phone || '').trim();
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '');

  if (!fullName) {
    errors.push('Họ tên là bắt buộc');
  }

  if (!email) {
    errors.push('Email là bắt buộc');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email không hợp lệ');
  }

  if (!password) {
    errors.push('Mật khẩu là bắt buộc');
  } else if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  if (username && !/^[a-z0-9._-]{3,30}$/.test(username)) {
    errors.push('Username chỉ gồm chữ thường, số, ., _, - và dài 3-30 ký tự');
  }

  if (phone && !/^[0-9+\-\s]{8,20}$/.test(phone)) {
    errors.push('Số điện thoại không hợp lệ');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      fullName,
      username,
      phone,
      email,
      password,
    },
  };
}

export function validateVerifyCccdPayload(payload) {
  const errors = [];
  const cccdNumber = String(payload?.cccdNumber || '').trim();

  if (!cccdNumber) {
    errors.push('CCCD là bắt buộc');
  } else if (!/^\d{9,12}$/.test(cccdNumber)) {
    errors.push('CCCD phải gồm 9-12 chữ số');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      cccdNumber,
    },
  };
}

export function validateChangePasswordByCccdPayload(payload) {
  const errors = [];
  const email = normalizeEmail(payload?.email);
  const cccdNumber = String(payload?.cccdNumber || '').trim();
  const newPassword = String(payload?.newPassword || '');

  if (!email) {
    errors.push('Email là bắt buộc');
  }

  if (!cccdNumber) {
    errors.push('CCCD là bắt buộc');
  } else if (!/^\d{9,12}$/.test(cccdNumber)) {
    errors.push('CCCD phải gồm 9-12 chữ số');
  }

  if (!newPassword) {
    errors.push('Mật khẩu mới là bắt buộc');
  } else if (newPassword.length < 6) {
    errors.push('Mật khẩu mới phải có ít nhất 6 ký tự');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      email,
      cccdNumber,
      newPassword,
    },
  };
}
