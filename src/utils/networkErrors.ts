const API_FALLBACK_STATUS_PATTERN = /\bapi request failed \((?:500|502|503|504)\)/i;

export const isApiFallbackFailure = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("failed to fetch") || API_FALLBACK_STATUS_PATTERN.test(message);
};
