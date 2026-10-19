import test from 'node:test';
import assert from 'node:assert/strict';

// Test API Response Envelope Unwrapping and Error Construction
function parseApiResponse(json) {
  if (!json.success) {
    const error = new Error(json.message || json.error?.code || 'Request failed');
    error.code = json.error?.code || 'UNKNOWN_ERROR';
    error.fieldErrors = json.error?.details || [];
    throw error;
  }
  return json.data;
}

// Test Token Storage Logic
function createTokenStorage(mockStorage = {}) {
  return {
    get() {
      return mockStorage['agriguard.token'] || null;
    },
    getRefresh() {
      return mockStorage['agriguard.refreshToken'] || null;
    },
    set(token, refreshToken) {
      mockStorage['agriguard.token'] = token;
      if (refreshToken) mockStorage['agriguard.refreshToken'] = refreshToken;
    },
    clear() {
      delete mockStorage['agriguard.token'];
      delete mockStorage['agriguard.refreshToken'];
    }
  };
}

test('Auth: Successfully unpacks standard Express backend response envelope', () => {
  const mockBackendLoginResponse = {
    success: true,
    message: 'Login successful',
    data: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.payload',
      refreshToken: 'refresh-uuid-token',
      user: {
        id: 'user_123',
        fullName: 'Sunil Perera',
        email: 'sunil@farmer.lk',
        role: 'FARMER'
      }
    }
  };

  const data = parseApiResponse(mockBackendLoginResponse);
  assert.equal(data.user.fullName, 'Sunil Perera');
  assert.equal(data.user.role, 'FARMER');
  assert.ok(data.accessToken);
  assert.ok(data.refreshToken);
});

test('Auth: Rejects invalid credentials with backend structured error envelope', () => {
  const mockBackendErrorResponse = {
    success: false,
    message: 'Invalid email or password',
    error: {
      code: 'AUTH_INVALID_CREDENTIALS',
      details: [{ field: 'password', message: 'Incorrect password' }]
    }
  };

  assert.throws(
    () => parseApiResponse(mockBackendErrorResponse),
    (err) => {
      assert.equal(err.code, 'AUTH_INVALID_CREDENTIALS');
      assert.equal(err.fieldErrors.length, 1);
      assert.equal(err.fieldErrors[0].field, 'password');
      return true;
    }
  );
});

test('Auth: Registration validates role enum and formats fullName', () => {
  const allowedRoles = ['FARMER', 'AGRICULTURAL_OFFICER', 'TRANSPORT_OPERATOR', 'ADMIN'];

  function prepareRegistration(input) {
    const fullName = (input.fullName || input.name || '').trim();
    if (!fullName) throw new Error('Full name is required');
    if (!allowedRoles.includes(input.role)) {
      throw new Error(`Invalid role: ${input.role}`);
    }
    return {
      fullName,
      email: input.email.toLowerCase().trim(),
      password: input.password,
      role: input.role,
      phoneNumber: input.phoneNumber || undefined
    };
  }

  const validPayload = prepareRegistration({
    name: 'Kamal Bandara',
    email: 'KAMAL@SLIIT.LK ',
    password: 'SecurePassword123!',
    role: 'FARMER'
  });

  assert.equal(validPayload.fullName, 'Kamal Bandara');
  assert.equal(validPayload.email, 'kamal@sliit.lk');
  assert.equal(validPayload.role, 'FARMER');

  assert.throws(
    () => prepareRegistration({ fullName: 'Test', email: 't@t.com', password: '123', role: 'INVALID_ROLE' }),
    /Invalid role/
  );
});

test('Auth: Token storage handles persistence and refresh token isolation', () => {
  const store = {};
  const tokenStorage = createTokenStorage(store);

  assert.equal(tokenStorage.get(), null);
  tokenStorage.set('access_123', 'refresh_456');
  assert.equal(tokenStorage.get(), 'access_123');
  assert.equal(tokenStorage.getRefresh(), 'refresh_456');

  tokenStorage.clear();
  assert.equal(tokenStorage.get(), null);
  assert.equal(tokenStorage.getRefresh(), null);
});
