import test from "node:test";
import assert from "node:assert/strict";

// Mock localStorage environment for Node.js
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

// Use jiti to import the TypeScript module without extra compilation step
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const jiti = require("jiti")(process.cwd());

const axios = jiti("axios");
const { default: apiClient } = jiti("./src/shared/api/apiClient.ts");

const ACCESS_TOKEN_KEY = "tilet3d_access_token";
const REFRESH_TOKEN_KEY = "tilet3d_refresh_token";
const USER_KEY = "tilet3d_user";
const CART_STORAGE_KEY = "tilet3d-cart-storage";

// Retrieve the registered response error interceptor handler
const responseInterceptor = apiClient.interceptors.response.handlers[0];
const requestInterceptor = apiClient.interceptors.request.handlers[0];

function createMock401Error(url = "/test-protected/") {
  return {
    response: { status: 401, data: { detail: "Authentication credentials were not provided." } },
    config: {
      url,
      headers: {},
      _retry: false,
    },
  };
}

test.beforeEach(() => {
  storage.clear();
});

test("1. Request interceptor attaches Bearer token from localStorage", () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, "test_access_token_123");
  const config = { headers: {} };
  const result = requestInterceptor.fulfilled(config);
  assert.equal(result.headers.Authorization, "Bearer test_access_token_123");
});

test("2. Successful refresh saves both new access token and rotated refresh token", async () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, "expired_access_token");
  localStorage.setItem(REFRESH_TOKEN_KEY, "initial_refresh_token_1");

  const originalPost = axios.post;
  let refreshCalled = false;
  let refreshPayload = null;

  axios.post = async (url, data) => {
    if (url.includes("/auth/token/refresh/")) {
      refreshCalled = true;
      refreshPayload = data;
      return {
        data: {
          access: "new_rotated_access_token_2",
          refresh: "new_rotated_refresh_token_2",
        },
      };
    }
    return originalPost(url, data);
  };

  try {
    const error401 = createMock401Error();
    // Stub apiClient execution of retried request
    const originalApiClient = apiClient.request;

    // Execute the rejected handler
    const retryPromise = responseInterceptor.rejected(error401);

    // Let the refresh process complete
    await retryPromise.catch(() => {});

    assert.equal(refreshCalled, true, "axios.post should be called for refresh");
    assert.deepEqual(refreshPayload, { refresh: "initial_refresh_token_1" });
    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), "new_rotated_access_token_2");
    assert.equal(
      localStorage.getItem(REFRESH_TOKEN_KEY),
      "new_rotated_refresh_token_2",
      "Rotated refresh token must be persisted in localStorage"
    );
    assert.equal(error401.config._retry, true, "_retry flag must be set to prevent infinite loop");
    assert.equal(
      error401.config.headers.Authorization,
      "Bearer new_rotated_access_token_2",
      "Retried request header must contain new access token"
    );
  } finally {
    axios.post = originalPost;
  }
});

test("3. Successful refresh without rotated token preserves existing refresh token", async () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, "expired_access_token");
  localStorage.setItem(REFRESH_TOKEN_KEY, "existing_refresh_token");

  const originalPost = axios.post;
  axios.post = async (url) => {
    if (url.includes("/auth/token/refresh/")) {
      return {
        data: {
          access: "new_access_token_only",
          // no refresh token returned
        },
      };
    }
  };

  try {
    const error401 = createMock401Error();
    await responseInterceptor.rejected(error401).catch(() => {});

    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), "new_access_token_only");
    assert.equal(
      localStorage.getItem(REFRESH_TOKEN_KEY),
      "existing_refresh_token",
      "Existing refresh token should remain if backend does not rotate"
    );
  } finally {
    axios.post = originalPost;
  }
});

test("4. Failed refresh clears all session tokens and rejects error", async () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, "stale_access_token");
  localStorage.setItem(REFRESH_TOKEN_KEY, "blacklisted_refresh_token");
  localStorage.setItem(USER_KEY, JSON.stringify({ id: "user-123" }));
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [] }));

  const originalPost = axios.post;
  const refreshError = new Error("Token is blacklisted");
  refreshError.response = { status: 401, data: { detail: "Token is blacklisted" } };

  axios.post = async (url) => {
    if (url.includes("/auth/token/refresh/")) {
      throw refreshError;
    }
  };

  try {
    const error401 = createMock401Error();
    await assert.rejects(
      async () => {
        await responseInterceptor.rejected(error401);
      },
      (err) => {
        assert.equal(err.message, "Token is blacklisted");
        return true;
      }
    );

    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), null, "access token should be removed");
    assert.equal(localStorage.getItem(REFRESH_TOKEN_KEY), null, "refresh token should be removed");
    assert.equal(localStorage.getItem(USER_KEY), null, "user info should be removed");
    assert.equal(localStorage.getItem(CART_STORAGE_KEY), null, "cart storage should be removed");
  } finally {
    axios.post = originalPost;
  }
});

test("5. Missing refresh token in localStorage clears storage and rejects without calling refresh", async () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, "orphan_access_token");
  localStorage.setItem(USER_KEY, JSON.stringify({ id: "user-123" }));
  // No refresh token in storage

  const originalPost = axios.post;
  let refreshCalled = false;
  axios.post = async () => {
    refreshCalled = true;
  };

  try {
    const error401 = createMock401Error();
    await assert.rejects(async () => {
      await responseInterceptor.rejected(error401);
    });

    assert.equal(refreshCalled, false, "axios.post should not be called when refresh token is missing");
    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), null);
    assert.equal(localStorage.getItem(USER_KEY), null);
  } finally {
    axios.post = originalPost;
  }
});

test("6. Request with _retry: true is not retried again (prevents infinite loop)", async () => {
  localStorage.setItem(REFRESH_TOKEN_KEY, "some_refresh_token");

  const originalPost = axios.post;
  let refreshCalls = 0;
  axios.post = async () => {
    refreshCalls++;
  };

  try {
    const errorAlreadyRetried = {
      response: { status: 401 },
      config: { url: "/test/", _retry: true },
    };

    await assert.rejects(async () => {
      await responseInterceptor.rejected(errorAlreadyRetried);
    });

    assert.equal(refreshCalls, 0, "Already-retried requests must not trigger further refresh attempts");
  } finally {
    axios.post = originalPost;
  }
});

test("7. Concurrent 401 requests share a single in-flight refresh call", async () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, "expired_token");
  localStorage.setItem(REFRESH_TOKEN_KEY, "shared_refresh_token");

  const originalPost = axios.post;
  let refreshCallCount = 0;

  axios.post = async (url) => {
    if (url.includes("/auth/token/refresh/")) {
      refreshCallCount++;
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 20));
      return {
        data: {
          access: "shared_new_access_token",
          refresh: "shared_new_refresh_token",
        },
      };
    }
  };

  try {
    const req1 = createMock401Error("/api/req1/");
    const req2 = createMock401Error("/api/req2/");

    // Fire both concurrent requests at once
    const p1 = responseInterceptor.rejected(req1).catch(() => {});
    const p2 = responseInterceptor.rejected(req2).catch(() => {});

    await Promise.all([p1, p2]);

    assert.equal(
      refreshCallCount,
      1,
      "Concurrent 401 requests must deduplicate to a single refresh call"
    );
    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), "shared_new_access_token");
    assert.equal(localStorage.getItem(REFRESH_TOKEN_KEY), "shared_new_refresh_token");
    assert.equal(req1.config.headers.Authorization, "Bearer shared_new_access_token");
    assert.equal(req2.config.headers.Authorization, "Bearer shared_new_access_token");
  } finally {
    axios.post = originalPost;
  }
});
