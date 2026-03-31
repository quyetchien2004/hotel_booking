const KNOWLEDGE = [
  {
    keywords: ['dat phong', 'booking', 'giu phong'],
    answer: 'De dat phong, ban vao trang Booking, chon tinh/thanh, thoi gian, muc gia va phong phu hop. Sau khi dang nhap, he thong tao booking va chuyen ban sang VNPAY de thanh toan online.',
  },
  {
    keywords: ['vnpay', 'thanh toan', 'online'],
    answer: 'He thong ho tro thanh toan online qua VNPay theo 2 cach: thanh toan 100% hoac dat coc 30%. Giao dich thanh cong se cap nhat trang thai booking va phat hanh so hoa don dien tu.',
  },
  {
    keywords: ['hoa don', 'invoice', 'bien lai'],
    answer: 'Sau khi giao dich thanh cong, booking se duoc gan so hoa don tu dong. Ban co the xem so hoa don trong trang Ket qua thanh toan va trong muc Don dat phong cua toi.',
  },
  {
    keywords: ['voucher', 'welcome10', 'loyal10', 'frequent25'],
    answer: 'Voucher WELCOME10 danh cho khach moi, LOYAL10 danh cho khach da co booking thanh cong, FREQUENT25 uu tien tai khoan da xac thuc CCCD va co do tin cay cao.',
  },
  {
    keywords: ['cccd', 'xac thuc', 'trust'],
    answer: 'Ban co the xac thuc CCCD trong trang My Account. Sau khi xac thuc thanh cong, trust score tang len va co the mo them uu dai cho tai khoan.',
  },
  {
    keywords: ['phong trong', 'room available', 'con trong'],
    answer: 'Danh sach phong trong duoc tinh theo thoi gian ban tim kiem. Vao trang Booking, nhap khoang thoi gian va he thong se loai tru cac phong da co booking bi trung lich.',
  },
];

function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function askInternalChatbot(message) {
  const normalizedMessage = normalize(message);

  if (!normalizedMessage) {
    return {
      answer: 'Vui long nhap cau hoi cu the de toi ho tro ban ve dat phong, voucher, thanh toan VNPay hoac tai khoan.',
    };
  }

  const matched = KNOWLEDGE.find((item) => item.keywords.some((keyword) => normalizedMessage.includes(normalize(keyword))));
  if (matched) {
    return { answer: matched.answer };
  }

  return {
    answer: 'Toi co the ho tro cac chu de: dat phong, phong trong, voucher, thanh toan VNPay, hoa don va xac thuc CCCD. Ban co the hoi cu the hon de toi tra loi dung trong tam.',
  };
}