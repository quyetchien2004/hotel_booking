// Endpoint health-check để frontend hoặc hệ thống giám sát biết backend còn hoạt động hay không.
export function getHealth(_request, response) {
  response.json({
    // Trạng thái tổng quát của server.
    status: 'ok',
    // Thông điệp ngắn giúp dễ đọc khi test API thủ công.
    message: 'Backend healthy',
    // Thời gian phản hồi ở định dạng ISO để tiện log và debug.
    timestamp: new Date().toISOString(),
  });
}
