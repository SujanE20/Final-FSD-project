export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  return error.response?.data?.message || (error.code === 'ERR_NETWORK'
    ? 'Could not reach the API. Check that the backend is running.'
    : fallback);
}
