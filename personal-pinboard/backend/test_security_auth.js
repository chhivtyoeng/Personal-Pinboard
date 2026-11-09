import http from 'http';
import app from './server.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const PORT = process.env.PORT || 5000;
let server;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE SECURITY & AUTHENTICATION AUDIT TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Login without password must be rejected
    const res1 = await request('POST', '/api/auth/login', { email: 'admin@pinboard.dev' });
    assert(res1.status === 400, 'Login without password returns 400 Bad Request');

    // Test 2: Login with wrong password must be rejected
    const res2 = await request('POST', '/api/auth/login', {
      email: 'admin@pinboard.dev',
      password: 'wrong_password_xyz',
    });
    assert(res2.status === 401, 'Login with wrong password returns 401 Unauthorized');

    // Test 3: Login with valid admin credentials returns valid JWT and sanitized user
    const res3 = await request('POST', '/api/auth/login', {
      email: 'admin@pinboard.dev',
      password: 'password123',
    });
    assert(res3.status === 200, 'Valid admin login succeeds (200 OK)');
    assert(res3.body?.data?.token, 'JWT token is issued on valid login');
    assert(res3.body?.data?.user?.password === undefined, 'Password is removed from user response');
    const adminToken = res3.body?.data?.token;

    // Test 4: Mock JWT token bypass must be rejected by auth middleware
    const res4 = await request('GET', '/api/auth/me', null, 'mock-jwt-token-1');
    assert(res4.status === 401, 'Mock token bypass is rejected (401 Unauthorized)');

    // Test 5: Real admin token allows access to /api/auth/me
    const res5 = await request('GET', '/api/auth/me', null, adminToken);
    assert(res5.status === 200, 'Authenticated /api/auth/me succeeds with real token (200 OK)');
    assert(res5.body?.data?.email === 'admin@pinboard.dev', 'Correct authenticated user retrieved');

    // Test 6: Registration with privilege escalation attempt (passing role: 'admin')
    const testEmail = `test_user_${Date.now()}@pinboard.dev`;
    const res6 = await request('POST', '/api/auth/register', {
      username: `hacker_${Date.now()}`,
      email: testEmail,
      password: 'mypassword123',
      role: 'admin', // Attack: user attempts to make themselves admin
    });
    assert(res6.status === 201, 'Registration succeeds (201 Created)');
    assert(res6.body?.data?.user?.role === 'user', 'Privilege escalation blocked: role enforced as "user"');
    const userToken = res6.body?.data?.token;
    const user1Id = res6.body?.data?.user?.id;

    // Test 7: Registration password validation (< 6 chars)
    const res7 = await request('POST', '/api/auth/register', {
      username: 'weakpw',
      email: `weak_${Date.now()}@pinboard.dev`,
      password: '123',
    });
    assert(res7.status === 400, 'Short password (< 6 chars) rejected with 400 Bad Request');

    // Test 8: Registration email format validation
    const res8 = await request('POST', '/api/auth/register', {
      username: 'bademail',
      email: 'not-an-email',
      password: 'password123',
    });
    assert(res8.status === 400, 'Malformed email rejected with 400 Bad Request');

    // Test 9: Forgot password generates non-reusable code
    const res9 = await request('POST', '/api/auth/forgot-password', { email: testEmail });
    assert(res9.status === 200, 'Forgot password request succeeds');
    const resetCode = res9.body?.data?.dev_code;

    // Test 10: Reset password without code must be rejected (takeover blocked)
    const res10 = await request('POST', '/api/auth/reset-password', {
      email: testEmail,
      newPassword: 'newSecretPassword123',
    });
    assert(res10.status === 400, 'Reset password without code is rejected (takeover blocked)');

    // Test 11: Reset password with wrong code must be rejected
    const res11 = await request('POST', '/api/auth/reset-password', {
      email: testEmail,
      code: '000000',
      newPassword: 'newSecretPassword123',
    });
    assert(res11.status === 400, 'Reset password with incorrect code is rejected');

    // Test 12: Reset password with valid code succeeds
    if (resetCode) {
      const res12 = await request('POST', '/api/auth/reset-password', {
        email: testEmail,
        code: resetCode,
        newPassword: 'newSecretPassword123',
      });
      assert(res12.status === 200, 'Reset password with valid code succeeds');

      // Verify login with new password
      const res12Login = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'newSecretPassword123',
      });
      assert(res12Login.status === 200, 'Login with new updated password succeeds');

      // Verify old password no longer works
      const res12Old = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'mypassword123',
      });
      assert(res12Old.status === 401, 'Old password rejected after password reset');
    }

    // Test 13: Change password without currentPassword must be rejected
    const res13 = await request('PUT', '/api/users/password', { newPassword: 'anotherPassword123' }, userToken);
    assert(res13.status === 400, 'Change password without currentPassword rejected (400 Bad Request)');

    // Test 14: Change password with incorrect currentPassword must be rejected
    const res14 = await request(
      'PUT',
      '/api/users/password',
      { currentPassword: 'wrongPassword', newPassword: 'anotherPassword123' },
      userToken
    );
    assert(res14.status === 400, 'Change password with incorrect currentPassword rejected (400 Bad Request)');

    // Test 15: Regular user cannot access admin routes
    const res15 = await request('GET', '/api/admin/users', null, userToken);
    assert(res15.status === 403, 'Regular user blocked from admin routes (403 Forbidden)');

    // Test 16: Admin user can access admin routes
    const res16 = await request('GET', '/api/admin/users', null, adminToken);
    assert(res16.status === 200, 'Admin user can access /api/admin/users (200 OK)');
    assert(Array.isArray(res16.body?.data?.users), 'Admin users list retrieved');
    assert(
      res16.body?.data?.users.every((u) => u.password === undefined),
      'All users sanitized: no password field returned'
    );

    // Test 17: Board authorization - User creates board
    const res17 = await request(
      'POST',
      '/api/boards',
      { name: 'My Secure Board', description: 'Private inspiration', is_private: true },
      userToken
    );
    assert(res17.status === 201, 'User can create their own board');
    const boardId = res17.body?.data?.id;

    // Test 18: Another user cannot save pins to or modify the first user's board (IDOR check)
    // Create second user
    const resUser2 = await request('POST', '/api/auth/register', {
      username: `user2_${Date.now()}`,
      email: `user2_${Date.now()}@pinboard.dev`,
      password: 'password123',
    });
    const user2Token = resUser2.body?.data?.token;
    const user2Id = resUser2.body?.data?.user?.id;

    // User 2 tries to modify User 1's board
    const res18 = await request('POST', `/api/boards/${boardId}/pins`, { pin_id: 1 }, user2Token);
    assert(res18.status === 403, 'Cross-user board modification rejected with 403 Forbidden (IDOR blocked)');

    // User 2 tries to update User 1's board
    const res18b = await request('PUT', `/api/boards/${boardId}`, { name: 'Hacked Name' }, user2Token);
    assert(res18b.status === 403, 'Cross-user board update rejected with 403 Forbidden');

    // Test 19: Pin mass assignment prevention
    // Create pin as user 1
    const resPin = await request(
      'POST',
      '/api/pins',
      {
        title: 'Original Title',
        image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
        description: 'Original Description',
      },
      userToken
    );
    assert(resPin.status === 201, 'User 1 created pin');
    const pinId = resPin.body?.data?.id;

    // Update pin trying to inject likes_count, rating_avg, user_id
    const resPinUpdate = await request(
      'PUT',
      `/api/pins/${pinId}`,
      {
        title: 'Updated Title',
        likes_count: 99999, // Injection attempt
        user_id: 9999, // Ownership steal attempt
      },
      userToken
    );
    assert(resPinUpdate.status === 200, 'Pin update succeeds');
    assert(resPinUpdate.body?.data?.title === 'Updated Title', 'Title was updated');
    assert(resPinUpdate.body?.data?.likes_count !== 99999, 'Mass assignment blocked: likes_count injection rejected');

    // Test 20: Regular user cannot delete global category
    const res20 = await request('DELETE', '/api/categories/1', null, userToken);
    assert(res20.status === 403, 'Non-admin deleting category rejected with 403 Forbidden');

    // Test 21: User creates a safety report for pin
    const res21 = await request(
      'POST',
      `/api/pins/${pinId}/report`,
      {
        reason: 'Inappropriate content',
        details: 'Testing report deletion workflow',
      },
      userToken
    );
    assert(res21.status === 201, 'User can submit safety report (201 Created)');
    const reportId = res21.body?.data?.id;

    // Test 22: Non-admin deleting report is rejected (403 Forbidden)
    const res22 = await request('DELETE', `/api/admin/reports/${reportId}`, null, userToken);
    assert(res22.status === 403, 'Non-admin deleting report rejected with 403 Forbidden');

    // Test 23: Admin can delete safety report (200 OK)
    const res23 = await request('DELETE', `/api/admin/reports/${reportId}`, null, adminToken);
    assert(res23.status === 200, 'Admin deleting report succeeds with 200 OK');

    // Test 24: Deleting already deleted report returns 404 Not Found without crashing
    const res24 = await request('DELETE', `/api/admin/reports/${reportId}`, null, adminToken);
    assert(res24.status === 404, 'Deleting non-existent report returns 404 Not Found');

    // Test 25: Malformed report ID returns 404 without 500 server crash
    const res25 = await request('DELETE', '/api/admin/reports/invalid_id_format', null, adminToken);
    assert(res25.status === 404, 'Malformed report ID returns 404 Not Found (no 500 crash)');

    // Test 26: Safety report deletion does NOT delete the underlying pin
    const resPinCheck = await request('GET', `/api/pins/${pinId}`, null, userToken);
    assert(resPinCheck.status === 200, 'Pin remains intact after safety report removal');

    // Test 27: Admin can create and delete category via route param alias /:categoryId
    const resCat = await request(
      'POST',
      '/api/categories',
      { name: `Temp Cat ${Date.now()}` },
      adminToken
    );
    assert(resCat.status === 201, 'Admin can create category');
    const tempCatId = resCat.body?.data?.id;

    const resDelCat = await request('DELETE', `/api/admin/categories/${tempCatId}`, null, adminToken);
    assert(resDelCat.status === 200, 'Admin can delete category via /api/admin/categories/:id');

    // Test 28: Admin can delete pin via route param alias
    const resDelPin = await request('DELETE', `/api/admin/pins/${pinId}`, null, adminToken);
    assert(resDelPin.status === 200, 'Admin can delete pin via /api/admin/pins/:id');

    // Test 29: Admin stats endpoint returns correct numeric counters
    const resStats = await request('GET', '/api/admin/stats', null, adminToken);
    assert(resStats.status === 200, 'Admin stats retrieved successfully (200 OK)');
    assert(typeof resStats.body?.data?.totalCategories === 'number', 'totalCategories is included in stats');
    assert(typeof resStats.body?.data?.totalReports === 'number', 'totalReports is included in stats');

    // Teardown / Cleanup: Delete test fixtures so database remains strictly clean
    if (boardId) {
      const resCleanBoard = await request('DELETE', `/api/boards/${boardId}`, null, userToken);
      assert(resCleanBoard.status === 200, 'Teardown: test board deleted cleanly');
    }
    if (user1Id) {
      const resCleanUser1 = await request('DELETE', `/api/admin/users/${user1Id}`, null, adminToken);
      assert(resCleanUser1.status === 200, 'Teardown: test user 1 deleted cleanly');
    }
    if (user2Id) {
      const resCleanUser2 = await request('DELETE', `/api/admin/users/${user2Id}`, null, adminToken);
      assert(resCleanUser2.status === 200, 'Teardown: test user 2 deleted cleanly');
    }

    console.log(`\n========================================`);
    console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Fatal error during testing:', err);
    failed++;
  } finally {
    process.exit(failed > 0 ? 1 : 0);
  }
}

setTimeout(() => {
  runTests();
}, 600);
