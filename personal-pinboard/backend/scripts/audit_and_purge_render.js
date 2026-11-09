import https from 'https';

const BASE_URL = 'personal-backend-r7pa.onrender.com';

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Pinboard-Auditor/1.0',
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(
      {
        hostname: BASE_URL,
        port: 443,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function auditAndPurge() {
  console.log('=== AUDITING LIVE RENDER POSTGRESQL DATABASE ===');
  console.log(`Connecting to https://${BASE_URL}...`);

  // 1. Login as Admin
  console.log('\n[1] Authenticating as Admin...');
  const loginRes = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@pinboard.dev',
    password: 'password123',
  });

  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.error('❌ Failed to login as admin:', loginRes);
    process.exit(1);
  }

  const adminToken = loginRes.data.data.token;
  console.log('✅ Admin authenticated successfully.');

  // 2. Fetch Initial Stats
  console.log('\n[2] Fetching initial admin stats...');
  const statsBefore = await apiRequest('GET', '/api/admin/stats', null, adminToken);
  console.log('Stats Before:', JSON.stringify(statsBefore.data?.data, null, 2));

  // 3. Inspect Users
  console.log('\n[3] Inspecting registered users...');
  const usersRes = await apiRequest('GET', '/api/admin/users?limit=100', null, adminToken);
  const users = usersRes.data?.data?.users || [];
  console.log(`Total users found: ${users.length}`);
  users.forEach((u) => {
    console.log(`  - User ID ${u.id}: username="${u.username}", email="${u.email}", role="${u.role}", status="${u.status}"`);
  });

  // Purge any non-admin users
  const nonAdminUsers = users.filter((u) => u.role !== 'admin' && u.email !== 'admin@pinboard.dev');
  if (nonAdminUsers.length > 0) {
    console.log(`\nPurging ${nonAdminUsers.length} non-admin user(s)...`);
    for (const u of nonAdminUsers) {
      const del = await apiRequest('DELETE', `/api/admin/users/${u.id}`, null, adminToken);
      console.log(`  Purged User ID ${u.id} (${u.username}): status ${del.status}`);
    }
  } else {
    console.log('✅ No non-admin users found (only admin exists).');
  }

  // 4. Inspect Pins
  console.log('\n[4] Inspecting pins...');
  const pinsRes = await apiRequest('GET', '/api/pins?includeHidden=true', null, adminToken);
  const pins = pinsRes.data?.data || [];
  console.log(`Total pins found: ${pins.length}`);
  if (pins.length > 0) {
    console.log(`Purging ${pins.length} pin(s)...`);
    for (const p of pins) {
      const del = await apiRequest('DELETE', `/api/admin/pins/${p.id}`, null, adminToken);
      console.log(`  Purged Pin ID ${p.id} ("${p.title}"): status ${del.status}`);
    }
  } else {
    console.log('✅ No pins found (0 pins).');
  }

  // 5. Inspect Boards
  console.log('\n[5] Inspecting boards...');
  const boardsRes = await apiRequest('GET', '/api/boards', null, adminToken);
  const boards = boardsRes.data?.data || [];
  console.log(`Total boards found: ${boards.length}`);
  if (boards.length > 0) {
    console.log(`Purging ${boards.length} board(s)...`);
    for (const b of boards) {
      const del = await apiRequest('DELETE', `/api/boards/${b.id}`, null, adminToken);
      console.log(`  Purged Board ID ${b.id} ("${b.name}"): status ${del.status}`);
    }
  } else {
    console.log('✅ No boards found (0 boards).');
  }

  // 6. Inspect Reports
  console.log('\n[6] Inspecting reports...');
  const reportsRes = await apiRequest('GET', '/api/admin/reports', null, adminToken);
  const reports = reportsRes.data?.data || [];
  console.log(`Total reports found: ${reports.length}`);
  if (reports.length > 0) {
    console.log(`Purging ${reports.length} report(s)...`);
    for (const r of reports) {
      const del = await apiRequest('DELETE', `/api/admin/reports/${r.id}`, null, adminToken);
      console.log(`  Purged Report ID ${r.id}: status ${del.status}`);
    }
  } else {
    console.log('✅ No reports found (0 reports).');
  }

  // 7. Re-fetch Stats to confirm clean state
  console.log('\n[7] Re-fetching final admin stats...');
  const statsAfter = await apiRequest('GET', '/api/admin/stats', null, adminToken);
  console.log('Stats After:', JSON.stringify(statsAfter.data?.data, null, 2));

  const finalData = statsAfter.data?.data;
  console.log('\n========================================');
  console.log('DATABASE INTEGRITY VERIFICATION:');
  console.log(`  Users: ${finalData?.totalUsers} (expected: 1)`);
  console.log(`  Pins: ${finalData?.totalPins} (expected: 0)`);
  console.log(`  Boards: ${finalData?.totalBoards} (expected: 0)`);
  console.log(`  Comments: ${finalData?.totalComments} (expected: 0)`);
  console.log(`  Reports: ${finalData?.totalReports} (expected: 0)`);
  console.log('========================================');

  const isValid =
    finalData?.totalUsers === 1 &&
    finalData?.totalPins === 0 &&
    finalData?.totalBoards === 0 &&
    finalData?.totalComments === 0 &&
    finalData?.totalReports === 0;

  if (isValid) {
    console.log('🎉 VERIFICATION SUCCESS: Live database is 100% clean and pristine!');
  } else {
    console.error('❌ VERIFICATION FAILED: Metrics do not match expected clean state!');
    process.exit(1);
  }
}

auditAndPurge().catch((err) => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
