export function notFoundHandler(request, _response, next) {
  const error = new Error(`Route not found: ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _request, response, _next) {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({
      message: 'Ảnh CCCD quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.',
    });
  }

  if (error?.type === 'entity.too.large') {
    return response.status(413).json({
      message: 'Dữ liệu gửi lên quá lớn. Vui lòng giảm dung lượng ảnh rồi thử lại.',
    });
  }

  response.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  });
}
