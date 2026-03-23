export function getHealth(_request, response) {
  response.json({
    status: 'ok',
    message: 'Backend healthy',
    timestamp: new Date().toISOString(),
  });
}
