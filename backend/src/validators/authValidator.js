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
    errors.push('Email hoac username la bat buoc');
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
    errors.push('Ho ten la bat buoc');
  }

  if (!email) {
    errors.push('Email la bat buoc');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email khong hop le');
  }

  if (!password) {
    errors.push('Mat khau la bat buoc');
  } else if (password.length < 6) {
    errors.push('Mat khau phai co it nhat 6 ky tu');
  }

  if (username && !/^[a-z0-9._-]{3,30}$/.test(username)) {
    errors.push('Username chi gom chu thuong, so, ., _, - va dai 3-30 ky tu');
  }

  if (phone && !/^[0-9+\-\s]{8,20}$/.test(phone)) {
    errors.push('So dien thoai khong hop le');
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

  if (!cccdNumber) {
    errors.push('CCCD la bat buoc');
  } else if (!/^\d{9,12}$/.test(cccdNumber)) {
    errors.push('CCCD phai gom 9-12 chu so');
  }

  if (!cccdImageDataUrl) {
    errors.push('Anh CCCD la bat buoc');
  } else if (!isValidDataUrlImage(cccdImageDataUrl)) {
    errors.push('Anh CCCD khong hop le');
  } else if (cccdImageDataUrl.length > 4_000_000) {
    errors.push('Anh CCCD qua lon');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      cccdNumber,
      cccdImageDataUrl,
    },
  };
}

export function validateSendResetOtpPayload(payload) {
  const errors = [];
  const email = normalizeEmail(payload?.email);

  if (!email) {
    errors.push('Email la bat buoc');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email khong hop le');
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
    errors.push('Email la bat buoc');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email khong hop le');
  }

  if (!otp) {
    errors.push('Ma OTP la bat buoc');
  } else if (!/^\d{6}$/.test(otp)) {
    errors.push('Ma OTP phai gom 6 chu so');
  }

  if (!newPassword) {
    errors.push('Mat khau moi la bat buoc');
  } else if (newPassword.length < 6) {
    errors.push('Mat khau moi phai co it nhat 6 ky tu');
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
