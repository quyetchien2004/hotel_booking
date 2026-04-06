const KNOWLEDGE = [
  {
    keywords: ['dat phong', 'booking', 'giu phong'],
    answer: 'Để đặt phòng, bạn vào trang Booking, chọn tỉnh/thành, thời gian, mức giá và phòng phù hợp. Sau khi đăng nhập, hệ thống tạo booking và chuyển bạn sang VNPAY để thanh toán online.',
  },
  {
    keywords: ['vnpay', 'thanh toan', 'online'],
    answer: 'Hệ thống hỗ trợ thanh toán online qua VNPay theo 2 cách: thanh toán 100% hoặc đặt cọc 30%. Giao dịch thành công sẽ cập nhật trạng thái booking và phát hành số hóa đơn điện tử.',
  },
  {
    keywords: ['hoa don', 'invoice', 'bien lai'],
    answer: 'Sau khi giao dịch thành công, booking sẽ được gán số hóa đơn tự động. Bạn có thể xem số hóa đơn trong trang Kết quả thanh toán và trong mục Đơn đặt phòng của tôi.',
  },
  {
    keywords: ['voucher', 'welcome10', 'loyal10', 'frequent25'],
    answer: 'Voucher WELCOME10 dành cho tài khoản mới chưa có booking thành công. FREQUENT25 chỉ áp dụng sau khi tài khoản đã xác thực CCCD và hoàn tất booking đầu tiên để đạt trust 100. LOYAL10 được mở thêm sau khi khách hoàn tất booking thành công lần thứ 2.',
  },
  {
    keywords: ['cccd', 'xac thuc', 'trust'],
    answer: 'Bạn có thể xác thực CCCD trong trang My Account. Sau khi xác thực thành công, trust score tăng lên và có thể mở thêm ưu đãi cho tài khoản.',
  },
  {
    keywords: ['phong trong', 'room available', 'con trong'],
    answer: 'Danh sách phòng trống được tính theo thời gian bạn tìm kiếm. Vào trang Booking, nhập khoảng thời gian và hệ thống sẽ loại trừ các phòng đã có booking bị trùng lịch.',
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
      answer: 'Vui lòng nhập câu hỏi cụ thể để tôi hỗ trợ bạn về đặt phòng, voucher, thanh toán VNPay hoặc tài khoản.',
    };
  }

  const matched = KNOWLEDGE.find((item) => item.keywords.some((keyword) => normalizedMessage.includes(normalize(keyword))));
  if (matched) {
    return { answer: matched.answer };
  }

  return {
    answer: 'Tôi có thể hỗ trợ các chủ đề: đặt phòng, phòng trống, voucher, thanh toán VNPay, hóa đơn và xác thực CCCD. Bạn có thể hỏi cụ thể hơn để tôi trả lời đúng trọng tâm.',
  };
}