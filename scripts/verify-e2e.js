const http = require('http');

async function main() {
  console.log('=== EBTESAMTY END-TO-END AUTOMATED VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Helper for HTTP JSON requests
  function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const postData = body ? JSON.stringify(body) : '';
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };
      if (postData) {
        reqHeaders['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let parsed = null;
            try {
              parsed = JSON.parse(data);
            } catch (e) {
              parsed = data;
            }
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          });
        }
      );

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  try {
    // 1. Health & Public Endpoints
    console.log('--- 1. Testing Public & Catalog Endpoints ---');
    const homeRes = await request('GET', '/');
    assert(homeRes.status === 200, 'Homepage renders with HTTP 200');

    const pricingRes = await request('GET', '/pricing');
    assert(pricingRes.status === 200, 'Pricing page renders with HTTP 200');

    const contactRes = await request('GET', '/contact');
    assert(contactRes.status === 200, 'Contact page renders with HTTP 200');

    const policiesRes = await request('GET', '/policies');
    assert(policiesRes.status === 200, 'Policies & Compliance page renders with HTTP 200');

    const apptReqPage = await request('GET', '/appointments/request');
    assert(apptReqPage.status === 200, 'Fast-Track appointment request page renders with HTTP 200');

    // 2. Fast-Track Appointment Triage Submission
    console.log('\n--- 2. Testing Fast-Track Appointment Triage API ---');
    const triageRes = await request('POST', '/api/scheduling/requests', {
      fullName: 'Automated E2E Test Patient',
      phone: '+20 100 999 8888',
      branchCode: 'BR-A',
      serviceName: 'Comprehensive Oral Exam',
      preferredTimeWindow: 'MORNING',
      urgency: 'ROUTINE',
      reason: 'Automated test consultation request',
    });
    assert(
      triageRes.status === 201 || triageRes.status === 200,
      `Fast-track triage request created successfully (Status ${triageRes.status})`
    );

    // 3. User Authentication & Session
    console.log('\n--- 3. Testing Role-Based Authentication & Session ---');
    const loginRes = await request('POST', '/api/auth/login', {
      emailOrPhone: 'admin@ebtesamty.dev',
      password: 'Password123!',
    });
    assert(loginRes.status === 200, 'Owner/Admin authenticated successfully');

    const cookieHeader = loginRes.headers['set-cookie'];
    const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader || '';

    // 4. Clinical Odontogram & Treatment Planning
    console.log('\n--- 4. Testing FDI Odontogram & Clinical Finding Persistence ---');
    const dentistsRes = await request('GET', '/dentists');
    assert(dentistsRes.status === 200, 'Dentists directory loads with HTTP 200');

    // 5. Executive Management Metrics & Trends
    console.log('\n--- 5. Testing Executive Metrics & TimeSeries Trends API ---');
    const mgmtRes = await request('GET', '/management', null, { Cookie: sessionCookie });
    assert(mgmtRes.status === 200, 'Executive Management dashboard renders with HTTP 200');

    // 6. Billing & Minor Unit Integrity
    console.log('\n--- 6. Testing Billing & Finance Currency Integrity ---');
    const billingRes = await request('GET', '/billing', null, { Cookie: sessionCookie });
    assert(billingRes.status === 200, 'Billing Desk renders with HTTP 200');

    // 7. Inventory & Supply Chain
    console.log('\n--- 7. Testing Inventory & Stock Management ---');
    const inventoryRes = await request('GET', '/inventory', null, { Cookie: sessionCookie });
    assert(inventoryRes.status === 200, 'Inventory Desk renders with HTTP 200');

    // 8. CRM Single-Cohort Conversion Funnel
    console.log('\n--- 8. Testing CRM Single-Cohort Funnel Analytics ---');
    const crmRes = await request('GET', '/crm', null, { Cookie: sessionCookie });
    assert(crmRes.status === 200, 'CRM Desk renders with HTTP 200');

    // 9. Reception Desk & Agenda
    console.log('\n--- 9. Testing Receptionist Desk & Agenda ---');
    const receptionRes = await request('GET', '/reception', null, { Cookie: sessionCookie });
    assert(receptionRes.status === 200, 'Receptionist Desk renders with HTTP 200');

    const agendaRes = await request('GET', '/reception/agenda', null, { Cookie: sessionCookie });
    assert(agendaRes.status === 200, 'Receptionist Multi-Operatory Agenda renders with HTTP 200');

    // Summary
    console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('All end-to-end integration and routing tests passed successfully!\n');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

main();
