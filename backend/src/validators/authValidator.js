function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function validateLoginPayload(payload) {
  const errors = [];
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '');

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      email,
      password,
    },
  };
}

export function validateRegisterPayload(payload) {
  const errors = [];
  const name = String(payload?.name || '').trim();
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '');

  if (!name) {
    errors.push('Name is required');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email is invalid');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  };

  return {
    valid: errors.length === 0,
    errors,
    data: {
      name,
      email,
      password,
    },
  };
}
