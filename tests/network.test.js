import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { axiosRequestWithRetry, axiosGetWithRetry, axiosPostWithRetry } from '../src/util/network.js';

// Mock console.log to avoid cluttering test output
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

describe('axiosRequestWithRetry', () => {
  let mockAxios;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    jest.clearAllMocks();
    jest.setTimeout(10000);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('successful requests', () => {
    it('should return response on first attempt for GET request', async () => {
      const mockData = { id: 1, name: 'Test User' };
      mockAxios.onGet('/api/users/1').reply(200, mockData);

      const response = await axiosRequestWithRetry('GET', '/api/users/1', { retries: 0 });

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
      expect(mockAxios.history.get.length).toBe(1);
    });

    it('should handle query parameters correctly', async () => {
      mockAxios.onGet('/api/users').reply(200, { users: [] });

      await axiosRequestWithRetry('GET', '/api/users', {
        params: { page: 1, limit: 10, sort: 'desc' },
        retries: 0
      });

      expect(mockAxios.history.get[0].params).toEqual({
        page: 1,
        limit: 10,
        sort: 'desc'
      });
    });

    it('should handle request headers correctly', async () => {
      mockAxios.onGet('/api/secure').reply(200, {});

      await axiosRequestWithRetry('GET', '/api/secure', {
        headers: {
          Authorization: 'Bearer token123',
          'X-Custom-Header': 'custom-value'
        },
        retries: 0
      });

      expect(mockAxios.history.get[0].headers.Authorization).toBe('Bearer token123');
      expect(mockAxios.history.get[0].headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should handle POST requests with data payload', async () => {
      const postData = { name: 'John Doe', email: 'john@example.com', age: 30 };
      mockAxios.onPost('/api/users').reply(201, { id: 1, ...postData });

      const response = await axiosRequestWithRetry('POST', '/api/users', {
        data: postData,
        headers: { 'Content-Type': 'application/json' },
        retries: 0
      });

      expect(response.status).toBe(201);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(postData);
      expect(response.data).toHaveProperty('id', 1);
    });

    it('should handle PUT requests with update data', async () => {
      const updateData = { name: 'Jane Doe' };
      mockAxios.onPut('/api/users/1').reply(200, { id: 1, ...updateData });

      const response = await axiosRequestWithRetry('PUT', '/api/users/1', {
        data: updateData,
        retries: 0
      });

      expect(response.status).toBe(200);
      expect(JSON.parse(mockAxios.history.put[0].data)).toEqual(updateData);
    });

    it('should handle DELETE requests', async () => {
      mockAxios.onDelete('/api/users/1').reply(204, null);

      const response = await axiosRequestWithRetry('DELETE', '/api/users/1', { retries: 0 });

      expect(response.status).toBe(204);
      expect(mockAxios.history.delete.length).toBe(1);
    });
  });

  describe('retry logic for server errors', () => {
    it('should retry on 500 error and succeed on second attempt', async () => {
      mockAxios
        .onGet('/api/unstable')
        .replyOnce(500, { error: 'Internal Server Error' })
        .onGet('/api/unstable')
        .replyOnce(200, { success: true, data: 'Recovered data' });

      const response = await axiosRequestWithRetry('GET', '/api/unstable', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true, data: 'Recovered data' });
      expect(mockAxios.history.get.length).toBe(2);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retrying')
      );
    });

    it('should retry on 502 Bad Gateway error', async () => {
      mockAxios
        .onGet('/api/gateway')
        .replyOnce(502, { error: 'Bad Gateway' })
        .onGet('/api/gateway')
        .replyOnce(200, { status: 'ok' });

      const response = await axiosRequestWithRetry('GET', '/api/gateway', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(2);
    });

    it('should retry on 503 Service Unavailable error', async () => {
      mockAxios
        .onGet('/api/service')
        .replyOnce(503, { error: 'Service Unavailable' })
        .onGet('/api/service')
        .replyOnce(200, { healthy: true });

      const response = await axiosRequestWithRetry('GET', '/api/service', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(2);
    });

    it('should retry on 504 Gateway Timeout error', async () => {
      mockAxios
        .onGet('/api/timeout')
        .replyOnce(504, { error: 'Gateway Timeout' })
        .onGet('/api/timeout')
        .replyOnce(200, { completed: true });

      const response = await axiosRequestWithRetry('GET', '/api/timeout', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(2);
    });

    it('should retry on 429 Too Many Requests error', async () => {
      mockAxios
        .onGet('/api/rate-limited')
        .replyOnce(429, { error: 'Too Many Requests', retryAfter: 1 })
        .onGet('/api/rate-limited')
        .replyOnce(200, { success: true });

      const response = await axiosRequestWithRetry('GET', '/api/rate-limited', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(2);
    });

    it('should retry on network errors', async () => {
      mockAxios
        .onGet('/api/network-error')
        .networkErrorOnce()
        .onGet('/api/network-error')
        .replyOnce(200, { recovered: true });

      const response = await axiosRequestWithRetry('GET', '/api/network-error', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(2);
    });

    it('should retry multiple times before succeeding', async () => {
      mockAxios
        .onGet('/api/retry-multiple')
        .replyOnce(500)
        .onGet('/api/retry-multiple')
        .replyOnce(502)
        .onGet('/api/retry-multiple')
        .replyOnce(503)
        .onGet('/api/retry-multiple')
        .replyOnce(200, { finally: 'success' });

      const response = await axiosRequestWithRetry('GET', '/api/retry-multiple', {
        retries: 3,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(4);
    });
  });

  describe('non-retryable errors', () => {
    it('should not retry on 400 Bad Request', async () => {
      mockAxios.onGet('/api/bad-request').reply(400, { error: 'Bad Request' });

      await expect(axiosRequestWithRetry('GET', '/api/bad-request', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.get.length).toBe(1);
    });

    it('should not retry on 401 Unauthorized', async () => {
      mockAxios.onGet('/api/unauthorized').reply(401, { error: 'Unauthorized' });

      await expect(axiosRequestWithRetry('GET', '/api/unauthorized', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.get.length).toBe(1);
    });

    it('should not retry on 403 Forbidden', async () => {
      mockAxios.onGet('/api/forbidden').reply(403, { error: 'Forbidden' });

      await expect(axiosRequestWithRetry('GET', '/api/forbidden', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.get.length).toBe(1);
    });

    it('should not retry on 404 Not Found', async () => {
      mockAxios.onGet('/api/not-found').reply(404, { error: 'Not Found' });

      await expect(axiosRequestWithRetry('GET', '/api/not-found', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.get.length).toBe(1);
    });

    it('should not retry on 409 Conflict', async () => {
      mockAxios.onPost('/api/conflict').reply(409, { error: 'Conflict' });

      await expect(axiosRequestWithRetry('POST', '/api/conflict', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.post.length).toBe(1);
    });
  });

  describe('idempotent methods', () => {
    it('should NOT retry GET method on client errors (403)', async () => {
      mockAxios.onGet('/api/forbidden-get').reply(403, { error: 'Forbidden' });

      await expect(axiosRequestWithRetry('GET', '/api/forbidden-get', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.get.length).toBe(1); // Only 1 attempt
    });

    it('should not retry POST method on non-retryable status codes', async () => {
      mockAxios.onPost('/api/forbidden-post').reply(403, { error: 'Forbidden' });

      await expect(axiosRequestWithRetry('POST', '/api/forbidden-post', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.post.length).toBe(1);
    });

    it('should not retry PUT method on non-retryable status codes', async () => {
      mockAxios.onPut('/api/forbidden-put').reply(403, { error: 'Forbidden' });

      await expect(axiosRequestWithRetry('PUT', '/api/forbidden-put', {
        retries: 3,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.put.length).toBe(1);
    });
  });

  describe('timeout parameter', () => {
    it('should stop retrying when overall timeout is reached', async () => {
      mockAxios.onGet('/api/slow').reply(500);

      const startTime = Date.now();

      await expect(axiosRequestWithRetry('GET', '/api/slow', {
        retries: 5,
        backoffFactor: 0.5,
        timeout: 1000
      })).rejects.toThrow('Request failed with status code 500');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1500);
      expect(mockAxios.history.get.length).toBeLessThan(6);
    });

    it('should succeed if timeout not reached', async () => {
      mockAxios
        .onGet('/api/recovers')
        .replyOnce(500)
        .onGet('/api/recovers')
        .replyOnce(200, { success: true });

      const response = await axiosRequestWithRetry('GET', '/api/recovers', {
        retries: 3,
        backoffFactor: 0.1,
        timeout: 5000
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(2);
    });

    it('should stop retrying when delay would exceed timeout', async () => {
      mockAxios.onGet('/api/long-delay').reply(500);

      const startTime = Date.now();

      await expect(
        axiosRequestWithRetry('GET', '/api/long-delay', {
          retries: 3,
          backoffFactor: 2,
          maxJitterMs: 0,
          timeout: 1000
        })
      ).rejects.toThrow();

      const duration = Date.now() - startTime;

      expect(mockAxios.history.get.length).toBeLessThan(4);

      expect(duration).toBeLessThan(1500);
    });

    it('should respect timeout on individual request', async () => {
      mockAxios.onGet('/api/slow-response').timeout();

      await expect(
        axiosRequestWithRetry('GET', '/api/slow-response', {
          retries: 1,
          backoffFactor: 0.1,
          timeout: 500
        })
      ).rejects.toThrow();

      expect(mockAxios.history.get.length).toBeGreaterThanOrEqual(1);
      expect(mockAxios.history.get.length).toBeLessThanOrEqual(2);
    });

    it('should not retry after timeout even on retryable error', async () => {
      let requestCount = 0;
      mockAxios.onGet('/api/retry-after-timeout').reply(() => {
        requestCount++;
        return [500, { error: 'Server Error' }];
      });

      await expect(axiosRequestWithRetry('GET', '/api/retry-after-timeout', {
        retries: 10,
        backoffFactor: 0.5,
        timeout: 800
      })).rejects.toThrow();

      expect(requestCount).toBeLessThan(5);
      expect(requestCount).toBeGreaterThan(0);
    });

    it('should work without timeout parameter (backward compatible)', async () => {
      mockAxios
        .onGet('/api/no-timeout')
        .replyOnce(500)
        .onGet('/api/no-timeout')
        .replyOnce(200, { success: true });

      const response = await axiosRequestWithRetry('GET', '/api/no-timeout', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(response.status).toBe(200);
      expect(mockAxios.history.get.length).toBe(2);
    });
    });

  describe('retry configuration options', () => {
    it('should respect custom retry count', async () => {
      mockAxios.onGet('/api/always-fail').reply(500);

      await expect(axiosRequestWithRetry('GET', '/api/always-fail', {
        retries: 2,
        backoffFactor: 0.1
      })).rejects.toThrow();

      // Initial attempt + 2 retries = 3 total requests
      expect(mockAxios.history.get.length).toBe(3);
    });

    it('should handle zero retries (no retry attempts)', async () => {
      mockAxios.onGet('/api/fail-once').reply(500);

      await expect(axiosRequestWithRetry('GET', '/api/fail-once', {
        retries: 0,
        backoffFactor: 0.1
      })).rejects.toThrow();

      expect(mockAxios.history.get.length).toBe(1);
    });

    it('should use exponential backoff with custom backoff factor', async () => {
      mockAxios.onGet('/api/backoff-test').reply(500);

      const startTime = Date.now();
      const promise = axiosRequestWithRetry('GET', '/api/backoff-test', {
        retries: 2,
        backoffFactor: 0.5,
        maxJitterMs: 0 // Disable jitter for predictable testing
      });

      await expect(promise).rejects.toThrow();
      const duration = Date.now() - startTime;

      // Expected delays: 500ms + 1000ms = 1500ms minimum (with backoffFactor 0.5: 250ms + 500ms = 750ms)
      expect(duration).toBeGreaterThanOrEqual(750);
      expect(mockAxios.history.get.length).toBe(3);
    });

    it('should add random jitter to delays', async () => {
      mockAxios.onGet('/api/jitter-test').reply(500);

      const delays = [];
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        try {
          await axiosRequestWithRetry('GET', '/api/jitter-test', {
            retries: 1,
            backoffFactor: 0.1,
            maxJitterMs: 500
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          delays.push(duration);
        }
        mockAxios.resetHistory();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Delays should vary due to jitter. Note: If randomness produces identical values by chance, this will fail.
      const uniqueDelays = new Set(delays.map(d => Math.floor(d / 100) * 100));
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('error handling', () => {
    it('should throw error after exhausting all retries', async () => {
      mockAxios.onGet('/api/exhaust-retries').reply(500);

      try {
        await axiosRequestWithRetry('GET', '/api/exhaust-retries', {
          retries: 1,
          backoffFactor: 0.1
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.response.status).toBe(500);
        expect(mockAxios.history.get.length).toBe(2);
      }
    });

    it('should preserve the original error object', async () => {
      const errorResponse = {
        error: 'Server Error',
        code: 'ERR_500',
        timestamp: new Date().toISOString()
      };
      mockAxios.onGet('/api/preserve-error').reply(500, errorResponse);

      try {
        await axiosRequestWithRetry('GET', '/api/preserve-error', {
          retries: 1,
          backoffFactor: 0.1
        });
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data).toEqual(errorResponse);
        expect(error.config).toBeDefined();
      }
    });

    it('should handle timeout errors correctly', async () => {
      // Simulates a network timeout (request aborted due to taking too long), not an HTTP 408 response from the server.
      mockAxios.onGet('/api/timeout').timeout();

      try {
        await axiosRequestWithRetry('GET', '/api/timeout', {
          retries: 1,
          backoffFactor: 0.1
        });
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED');
        expect(mockAxios.history.get.length).toBe(2);
      }
    });

    it('should handle 408 errors correctly', async () => {
      // Simulates a 408 Request Timeout error
      mockAxios.onGet('/api/timeout').reply(408);

      try {
        await axiosRequestWithRetry('GET', '/api/timeout', {
          retries: 1,
          backoffFactor: 0.1
        });
      } catch (error) {
        expect(error.response.status).toBe(408);
        expect(mockAxios.history.get.length).toBe(2);
      }
    });

    it('should handle connection refused errors', async () => {
      mockAxios.onGet('/api/connection-refused').networkError();

      try {
        await axiosRequestWithRetry('GET', '/api/connection-refused', {
          retries: 1,
          backoffFactor: 0.1
        });
      } catch (error) {
        expect(error.message).toBeDefined();
        expect(mockAxios.history.get.length).toBe(2);
      }
    });
  });

  describe('logging behavior', () => {
    it('should log successful request attempts', async () => {
      mockAxios.onGet('/api/log-success').reply(200, { data: 'test' });

      await axiosRequestWithRetry('GET', '/api/log-success', { retries: 0 });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[Attempt 1\/1\] Request to GET \/api\/log-success succeeded in \d+ms/)
      );
    });

    it('should log retry attempts', async () => {
      mockAxios
        .onGet('/api/log-retry')
        .replyOnce(500)
        .onGet('/api/log-retry')
        .replyOnce(200);

      await axiosRequestWithRetry('GET', '/api/log-retry', {
        retries: 1,
        backoffFactor: 0.1
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retry Attempt 2/2')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retrying in')
      );
    });

    it('should log when no more retries are available', async () => {
      mockAxios.onGet('/api/no-more-retries').reply(500);

      try {
        await axiosRequestWithRetry('GET', '/api/no-more-retries', {
          retries: 1,
          backoffFactor: 0.1
        });
      } catch (error) {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('No more retries')
        );
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty response data', async () => {
      mockAxios.onGet('/api/empty').reply(204, null);

      const response = await axiosRequestWithRetry('GET', '/api/empty', { retries: 0 });

      expect(response.status).toBe(204);
      expect(response.data).toBeNull();
    });

    it('should handle large response payloads', async () => {
      const largeData = { items: Array(1000).fill({ id: 1, name: 'Test' }) };
      mockAxios.onGet('/api/large').reply(200, largeData);

      const response = await axiosRequestWithRetry('GET', '/api/large', { retries: 0 });

      expect(response.data.items.length).toBe(1000);
    });

    it('should handle special characters in URLs', async () => {
      const specialUrl = '/api/users?filter=name:John%20Doe&tags=javascript,nodejs';
      mockAxios.onGet(specialUrl).reply(200, {});

      await axiosRequestWithRetry('GET', specialUrl, { retries: 0 });

      expect(mockAxios.history.get[0].url).toBe(specialUrl);
    });

    it('should handle concurrent requests independently', async () => {
      mockAxios
        .onGet('/api/request1')
        .replyOnce(500)
        .onGet('/api/request1')
        .replyOnce(200, { id: 1 })
        .onGet('/api/request2')
        .replyOnce(500)
        .onGet('/api/request2')
        .replyOnce(200, { id: 2 });

      const [response1, response2] = await Promise.all([
        axiosRequestWithRetry('GET', '/api/request1', { retries: 1, backoffFactor: 0.1 }),
        axiosRequestWithRetry('GET', '/api/request2', { retries: 1, backoffFactor: 0.1 })
      ]);

      expect(response1.data).toEqual({ id: 1 });
      expect(response2.data).toEqual({ id: 2 });
      expect(mockAxios.history.get.length).toBe(4);
    });
  });

  // Verify the wrappers work as expected
  describe('wrapper convenience functions', () => {
    it('axiosGetWithRetry should work like axiosRequestWithRetry with GET', async () => {
      mockAxios.onGet('/api/test').reply(200, { data: 'test' });

      const result1 = await axiosRequestWithRetry('GET', '/api/test');
      const result2 = await axiosGetWithRetry('/api/test');

      expect(result1.data).toEqual(result2.data);
    });

    it('axiosPostWithRetry should pass data correctly', async () => {
      const postData = { name: 'test' };
      mockAxios.onPost('/api/test').reply(200, { received: postData });

      const response = await axiosPostWithRetry('/api/test', postData);

      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(postData);
    });

    it('should preserve retry behavior', async () => {
      mockAxios
        .onGet('/api/retry')
        .replyOnce(500)
        .onGet('/api/retry')
        .replyOnce(200, { ok: true });

      const response = await axiosGetWithRetry('/api/retry', {}, { retries: 1, backoffFactor: 0.1 });

      expect(response.data).toEqual({ ok: true });
      expect(mockAxios.history.get.length).toBe(2);
    });
  });

  describe('wrapper functions with various parameter combinations', () => {
    it('axiosGetWithRetry: no config or retry', async () => {
      mockAxios.onGet('/api/get-no-config').reply(200, { data: 'test' });

      const response = await axiosGetWithRetry('/api/get-no-config');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
      expect(mockAxios.history.get.length).toBe(1);
    });

    it('axiosGetWithRetry: config and retry settings', async () => {
      mockAxios
        .onGet('/api/get-with-config')
        .replyOnce(500)
        .onGet('/api/get-with-config')
        .replyOnce(200, { success: true });

      const response = await axiosGetWithRetry(
        '/api/get-with-config',
        {
          headers: { 'X-Custom-Header': 'custom-value' },
          params: { page: 1, limit: 10 }
        },
        {
          retries: 1,
          backoffFactor: 0.1
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
      expect(mockAxios.history.get.length).toBe(2);
      // Verify headers and params were passed correctly
      expect(mockAxios.history.get[0].headers['X-Custom-Header']).toBe('custom-value');
      expect(mockAxios.history.get[0].params).toEqual({ page: 1, limit: 10 });
    });

    it('axiosPostWithRetry: data and config and retry', async () => {
      const postData = { name: 'John Doe', email: 'john@example.com' };
      mockAxios
        .onPost('/api/post-with-all')
        .replyOnce(500)
        .onPost('/api/post-with-all')
        .replyOnce(201, { id: 1, ...postData });

      const response = await axiosPostWithRetry(
        '/api/post-with-all',
        postData,
        {
          headers: { 'Content-Type': 'application/json', 'X-API-Key': 'test-key' },
          params: { validate: true }
        },
        {
          retries: 1,
          backoffFactor: 0.1,
          maxJitterMs: 0
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id', 1);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(postData);
      expect(mockAxios.history.post[0].headers['X-API-Key']).toBe('test-key');
      expect(mockAxios.history.post[0].params).toEqual({ validate: true });
      expect(mockAxios.history.post.length).toBe(2);
    });

    it('axiosPostWithRetry: empty data, config, empty retry', async () => {
      mockAxios.onPost('/api/post-empty-data').reply(200, { received: null });

      const response = await axiosPostWithRetry(
        '/api/post-empty-data',
        {},
        { headers: { 'Content-Type': 'application/json' } },
        {}
      );

      expect(response.status).toBe(200);
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({});
      expect(mockAxios.history.post.length).toBe(1);
    });

    it('axiosPostWithRetry: empty data, config, retry', async () => {
      mockAxios
        .onPost('/api/post-empty-data-retry')
        .replyOnce(503)
        .onPost('/api/post-empty-data-retry')
        .replyOnce(200, { status: 'recovered' });

      const response = await axiosPostWithRetry(
        '/api/post-empty-data-retry',
        {},
        { headers: { 'X-Test': 'value' }, params: { retry: true } },
        { retries: 1, backoffFactor: 0.1 }
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ status: 'recovered' });
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({});
      expect(mockAxios.history.post[0].headers['X-Test']).toBe('value');
      expect(mockAxios.history.post[0].params).toEqual({ retry: true });
      expect(mockAxios.history.post.length).toBe(2);
    });

    it('axiosPostWithRetry: data, config, retry', async () => {
      const postData = { action: 'update', value: 42 };
      mockAxios
        .onPost('/api/post-all-three')
        .replyOnce(502)
        .onPost('/api/post-all-three')
        .replyOnce(200, { processed: true, value: 42 });

      const response = await axiosPostWithRetry(
        '/api/post-all-three',
        postData,
        {
          headers: { 'Authorization': 'Bearer token123', 'X-Request-ID': 'req-123' },
          params: { format: 'json', pretty: true },
          timeout: 5000
        },
        {
          retries: 2,
          backoffFactor: 0.2,
          maxJitterMs: 100,
          timeout: 10000
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ processed: true, value: 42 });
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual(postData);
      expect(mockAxios.history.post[0].headers['Authorization']).toBe('Bearer token123');
      expect(mockAxios.history.post[0].headers['X-Request-ID']).toBe('req-123');
      expect(mockAxios.history.post[0].params).toEqual({ format: 'json', pretty: true });
      expect(mockAxios.history.post.length).toBe(2);

      // Verify retry happened
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retrying')
      );
    });
  });
});