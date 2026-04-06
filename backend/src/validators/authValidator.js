function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidDataUrlImage(value) {
  const raw = String(value || '').trim();
  return /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(raw);
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
    errors.push('Mật khẩu là bắt buộc');
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
  const cccdImageDataUrl = String(payload?.cccdImageDataUrl || '').trim();
  const faceImageDataUrl = String(payload?.faceImageDataUrl || '').trim();

  if (cccdNumber && !/^\d{9,12}$/.test(cccdNumber)) {
    errors.push('CCCD phải gồm 9-12 chữ số');
  }

  if (cccdImageDataUrl) {
    if (!isValidDataUrlImage(cccdImageDataUrl)) {
      errors.push('Ảnh CCCD không hợp lệ');
    } else if (cccdImageDataUrl.length > 4_000_000) {
      errors.push('Ảnh CCCD quá lớn');
    }
  }

  if (faceImageDataUrl) {
    if (!isValidDataUrlImage(faceImageDataUrl)) {
      errors.push('Ảnh khuôn mặt không hợp lệ');
    } else if (faceImageDataUrl.length > 4_000_000) {
      errors.push('Ảnh khuôn mặt quá lớn');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      cccdNumber,
      cccdImageDataUrl,
      faceImageDataUrl,
    },
  };
}

export function validateSendResetOtpPayload(payload) {
  const errors = [];
  const email = normalizeEmail(payload?.email);

  if (!email) {
    errors.push('Email là bắt buộc');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email không hợp lệ');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { email },
  };
}

export function validateResetPasswordWithOtpPayload(payload) {
  const errors = [];
  const email = normalizeEmail(payload?.email);
  const otp = String(payload?.otp || '').trim();
  const newPassword = String(payload?.newPassword || '');

  if (!email) {
    errors.push('Email là bắt buộc');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email không hợp lệ');
  }

  if (!otp) {
    errors.push('Mã OTP là bắt buộc');
  } else if (!/^\d{6}$/.test(otp)) {
    errors.push('Mã OTP phải gồm 6 chữ số');
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
      otp,
      newPassword,
    },
  };
}
