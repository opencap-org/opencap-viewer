// network.js
import axios from 'axios';

/**
 * Makes an HTTP request with retry logic.
 * @param {string} method - HTTP method ('GET', 'POST', 'PUT', etc.)
 * @param {string} url - The endpoint URL
 * @param {Object} options - Request options
 * @param {Object} options.headers - Headers to include
 * @param {Object} options.data - Data to send in the request body
 * @param {Object} options.params - URL query parameters
 * @param {number} options.retries - Number of retry attempts (default: 5)
 * @param {number} options.backoffFactor - Backoff factor for exponential delays (default: 1)
 * @param {number} options.maxJitterMs - Maximum random jitter in milliseconds (default: 1000)
 * @returns {Promise<Object>} Axios response object
 */
export async function makeRequestWithRetry(method, url, options = {}) {
  const {
    headers = null,
    data = null,
    params = null,
    retries = 5,
    backoffFactor = 1,
    maxJitterMs = 1000
  } = options;

  // Status codes that should trigger a retry
  const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

  // HTTP methods that are safe to retry (idempotent)
  const IDEMPOTENT_METHODS = ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'];

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const isFirstAttempt = attempt === 0;
    const attemptNumber = attempt + 1;
    const totalAttempts = retries + 1;

    // For testing. Will print attempts and times in browser console.
    if (!isFirstAttempt) {
      console.log(`[Retry Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} - Waiting before retry...`);
    }

    try {
      const startTime = Date.now();
      
      // Create axios config with start time for duration calculation
      const axiosConfig = {
        method,
        url,
        headers,
        data,
        params
      };
      
      // Store start time on config for error handling
      axiosConfig.__startTime = startTime;
      
      const response = await axios(axiosConfig);
      const duration = Date.now() - startTime;

      console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} succeeded in ${duration}ms`);

      // Success - return the response
      return response;

    } catch (error) {
      // Calculate duration if available
      // const duration = error.config && error.config.__startTime
      //   ? Date.now() - error.config.__startTime
      //   : 0;
      
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === retries;

      if (isLastAttempt) {
        console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} failed - No more retries`);
        // No more retries, throw the error
        throw error;
      }

      // Determine if we should retry this error
      let shouldRetry = false;
      let retryReason = '';

      // Check for network errors (no response)
      if (!error.response) {
        shouldRetry = true;
        retryReason = 'Network error';
      }
      // Check for retryable status codes (server errors or rate limiting)
      else if (RETRYABLE_STATUS_CODES.includes(error.response.status)) {
        shouldRetry = true;
        retryReason = `Status code ${error.response.status}`;
      }
      // For non-retryable status codes (4xx client errors), only retry if:
      // 1. The method is idempotent AND
      // 2. The status code is not in the 4xx range (client errors)
      else if (error.response.status >= 400 && error.response.status < 500) {
        // Client errors - don't retry
        shouldRetry = false;
        retryReason = `Client error ${error.response.status}`;
      }
      // For other status codes (3xx, etc.) with idempotent methods
      else if (IDEMPOTENT_METHODS.includes(method.toUpperCase())) {
        shouldRetry = true;
        retryReason = `Idempotent method ${method.toUpperCase()}`;
      }

      if (!shouldRetry) {
        console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} failed with non-retryable error - ${error.response?.status || error.message}`);
        // Don't retry this error
        throw error;
      }

      // Calculate delay with exponential backoff
      // Formula: backoffFactor * (2^(attempt-1)) * 1000
      const baseDelayMs = backoffFactor * Math.pow(2, attempt - 1) * 1000;

      // Add random jitter (0 to maxJitterMs)
      const jitterMs = Math.random() * maxJitterMs;
      const totalDelayMs = baseDelayMs + jitterMs;

      console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} failed (${retryReason}) - Retrying in ${Math.round(totalDelayMs)}ms (base: ${Math.round(baseDelayMs)}ms + jitter: ${Math.round(jitterMs)}ms)`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelayMs));
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}