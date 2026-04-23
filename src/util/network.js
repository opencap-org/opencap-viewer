// network.js
import axios from 'axios';
import {apiError} from './ErrorMessage';

/**
 * Makes an HTTP request with retry logic.
 * @param {string} method - HTTP method ('GET', 'POST', 'PUT', etc.)
 * @param {string} url - The endpoint URL
 * @param {Object} options - Request options
 * @param {Object} options.headers - Headers to include
 * @param {Object} options.data - Data to send in the request body
 * @param {Object} options.params - URL query parameters
 * @param {number} options.retries - Number of retry attempts (after first try) (default: 5)
 * @param {number} options.backoffFactor - Backoff factor for exponential delays (default: 1)
 * @param {number} options.maxJitterMs - Maximum random jitter in milliseconds (default: 1000)
 * @param {number} options.timeout - Overall timeout in milliseconds (default: null)
 * @returns {Promise<Object>} Axios response object
 */
export async function axiosRequestWithRetry(method, url, options = {}) {
  const {
    headers = null,
    data = null,
    params = null,
    retries = 5,
    backoffFactor = 1,
    maxJitterMs = 1000,
    timeout = null
  } = options;

  // Status codes that should trigger a retry
  const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

  let lastError = null;
  const overallStartTime = Date.now();

  for (let attempt = 0; attempt <= retries; attempt++) {
    const isFirstAttempt = attempt === 0;
    const attemptNumber = attempt + 1;
    const totalAttempts = retries + 1;

    // Check if we've exceeded the overall timeout before making the request
    if (timeout && (Date.now() - overallStartTime) >= timeout) {
      console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} - Timeout reached (${timeout}ms), stopping retries`);
      apiError('The request took too long to complete. Please try again.');
      throw new Error(`Request timeout after ${Date.now() - overallStartTime}ms (limit: ${timeout}ms)`);
    }

    // For testing. Will print attempts and times in browser console.
    if (!isFirstAttempt) {
      console.log(`[Retry Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} - Waiting before retry...`);
    }

    try {
      const requestStartTime = Date.now();

      // Calculate remaining timeout for this individual request
      let requestTimeout = undefined;
      if (timeout) {
        const elapsedTime = Date.now() - overallStartTime;
        requestTimeout = Math.max(1000, timeout - elapsedTime);
      }

      // Create axios config
      const axiosConfig = {
        method,
        url,
        data,
        params,
        timeout: requestTimeout
      };

      // Only add headers if they're provided, otherwise it will overwrite default headers
      // and the request will fail with error 403.
      if (headers) {
        axiosConfig.headers = headers;
      }

      const response = await axios(axiosConfig);
      const duration = Date.now() - requestStartTime;

      console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} succeeded in ${duration}ms`);

      // Success - return the response
      return response;

    } catch (error) {

      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === retries;

      // Don't retry if we've exceeded the overall timeout
      if (timeout && (Date.now() - overallStartTime) >= timeout) {
        console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} - Overall timeout reached (${timeout}ms), stopping retries`);
        apiError('The request took too long to complete. Please try again.');
        throw new Error(`Request timeout after ${Date.now() - overallStartTime}ms (limit: ${timeout}ms)`);
      }

      if (isLastAttempt) {
        console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} failed - No more retries`);
        // No more retries, throw the error
        if (!error.response) {
          apiError('There was a network error. Please check your internet connection and try again.');
        } else if (error.response.status >= 500) {
          apiError('The server encountered an error. Please try again.');
        } else if (error.response.status === 429) {
          apiError('Too many requests. Please wait a moment and try again later.');
        } else if (error.response.status === 408) {
          apiError('The request timed out. Please try again.');
        } else {
          apiError('An unexpected error occurred. Please try again.');
        }

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
      // Check for 408 Request Timeout from server should be retried, as it is server timeout and not
      // client timeout
      else if (error.response.status === 408) {
        shouldRetry = true;
        retryReason = `Status code 408 (Request Timeout)`;
      }
      // For non-retryable status codes (4xx client errors)
      else if (error.response.status >= 400 && error.response.status < 500) {
        // Client errors - don't retry
        shouldRetry = false;
        retryReason = `Client error ${error.response.status}`;
      } else {
        // Catch-all for any other status codes (e.g., 3xx, 1xx)
        shouldRetry = false;
        retryReason = `Unhandled status code ${error.response.status}`;
      }

      if (!shouldRetry) {
        console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} failed with non-retryable error - ${error.response?.status || error.message}`);
        // Don't retry this error
        if (error.response.status === 400) {
          apiError('The request was invalid. Please check your input and try again.');
        } else if (error.response.status === 401) {
          apiError('Your session has expired. Please log in again.');
        } else if (error.response.status === 403) {
          apiError('You do not have permission to perform this action.');
        } else if (error.response.status === 404) {
          apiError('The requested resource was not found.');
        } else if (error.response.status === 409) {
          apiError('There was a conflict with the current state. Please try again.');
        } else if (error.response.status >= 400 && error.response.status < 500) {
          apiError('There was an error with your request. Please try again.');
        }
        throw error;
      }

      // Calculate delay with exponential backoff
      // Formula: backoffFactor * (2^(attempt-1)) * 1000
      const baseDelayMs = backoffFactor * Math.pow(2, attempt - 1) * 1000;

      // Add random jitter (0 to maxJitterMs)
      const jitterMs = Math.random() * maxJitterMs;
      const totalDelayMs = baseDelayMs + jitterMs;

      // Check if the delay would exceed the overall timeout
      if (timeout && (Date.now() - overallStartTime + totalDelayMs) >= timeout) {
        console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} - Next retry delay would exceed timeout, stopping`);
        apiError('The request took too long to complete. Please try again.');
        throw error;
      }

      console.log(`[Attempt ${attemptNumber}/${totalAttempts}] Request to ${method} ${url} failed (${retryReason}) - Retrying in ${Math.round(totalDelayMs)}ms (base: ${Math.round(baseDelayMs)}ms + jitter: ${Math.round(jitterMs)}ms)`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelayMs));
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

export async function axiosGetWithRetry(url, config = {}, retryConfig = {}) {
  return axiosRequestWithRetry('GET', url, {
    ...config,  // headers, params, timeout from axios config
    ...retryConfig,  // retries, backoffFactor, etc.
    data: null  // GET doesn't have body
  });
}

export async function axiosPostWithRetry(url, data = {}, config = {}, retryConfig = {}) {
  return axiosRequestWithRetry('POST', url, {
    ...config,
    data,
    ...retryConfig
  });
}