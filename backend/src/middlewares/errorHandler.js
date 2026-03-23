export function notFoundHandler(request, _response, next) {
  const error = new Error(`Route not found: ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _request, response, _next) {
  response.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  });
}
