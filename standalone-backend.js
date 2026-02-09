const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 5000;

// In-memory data storage
let monitors = [];
let checkResults = new Map();
const activeIntervals = new Map();

// Check URL health
function checkUrl(targetUrl) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const urlObj = new url.URL(targetUrl);
        const client = urlObj.protocol === 'https:' ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            timeout: 30000,
            headers: {
                'User-Agent': 'ShopAlert-Monitor/1.0'
            }
        };

        const req = client.request(options, (res) => {
            const responseTime = Date.now() - startTime;
            const isUp = res.statusCode >= 200 && res.statusCode < 400;

            // Consume response data
            res.on('data', () => {});
            res.on('end', () => {
                resolve({
                    status: isUp ? 'up' : 'down',
                    statusCode: res.statusCode,
                    responseTime,
                    error: isUp ? null : `HTTP ${res.statusCode}`,
                    timestamp: new Date().toISOString()
                });
            });
        });

        req.on('error', (error) => {
            const responseTime = Date.now() - startTime;
            resolve({
                status: 'down',
                statusCode: null,
                responseTime,
                error: error.code || error.message,
                timestamp: new Date().toISOString()
            });
        });

        req.on('timeout', () => {
            req.destroy();
            const responseTime = Date.now() - startTime;
            resolve({
                status: 'down',
                statusCode: null,
                responseTime,
                error: 'TIMEOUT',
                timestamp: new Date().toISOString()
            });
        });

        req.end();
    });
}

// Start monitoring
function startMonitoring(monitorId, targetUrl, interval) {
    if (activeIntervals.has(monitorId)) {
        clearInterval(activeIntervals.get(monitorId));
    }

    // Initial check
    checkUrl(targetUrl).then(result => {
        checkResults.set(monitorId, result);
        console.log(`✓ Initial check for ${targetUrl}: ${result.status}`);
    });

    // Periodic checks
    const intervalId = setInterval(async () => {
        const result = await checkUrl(targetUrl);
        checkResults.set(monitorId, result);
        console.log(`✓ Checked ${targetUrl}: ${result.status} (${result.responseTime}ms)`);
    }, interval);

    activeIntervals.set(monitorId, intervalId);
}

// Stop monitoring
function stopMonitoring(monitorId) {
    if (activeIntervals.has(monitorId)) {
        clearInterval(activeIntervals.get(monitorId));
        activeIntervals.delete(monitorId);
        checkResults.delete(monitorId);
    }
}

// CORS headers
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse JSON body
function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve({});
            }
        });
    });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);

    // Handle OPTIONS for CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Health check
    if (pathname === '/health' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            activeMonitors: monitors.length
        }));
        return;
    }

    // Get all monitors
    if (pathname === '/api/monitors' && method === 'GET') {
        const monitorsWithResults = monitors.map(monitor => ({
            ...monitor,
            lastResult: checkResults.get(monitor.id) || null
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(monitorsWithResults));
        return;
    }

    // Add monitor
    if (pathname === '/api/monitors' && method === 'POST') {
        const body = await parseBody(req);

        if (!body.url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
        }

        const monitor = {
            id: Date.now().toString(),
            url: body.url,
            interval: body.interval || 300000,
            createdAt: new Date().toISOString()
        };

        monitors.push(monitor);
        startMonitoring(monitor.id, monitor.url, monitor.interval);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(monitor));
        return;
    }

    // Manual check
    const checkMatch = pathname.match(/^\/api\/monitors\/([^\/]+)\/check$/);
    if (checkMatch && method === 'POST') {
        const id = checkMatch[1];
        const monitor = monitors.find(m => m.id === id);

        if (!monitor) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Monitor not found' }));
            return;
        }

        const result = await checkUrl(monitor.url);
        checkResults.set(id, result);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
    }

    // Delete monitor
    const deleteMatch = pathname.match(/^\/api\/monitors\/([^\/]+)$/);
    if (deleteMatch && method === 'DELETE') {
        const id = deleteMatch[1];
        stopMonitoring(id);
        monitors = monitors.filter(m => m.id !== id);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Monitor deleted' }));
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 ShopAlert Backend (Standalone)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`📊 API: http://localhost:${PORT}/api/monitors`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Ready to monitor! (No dependencies needed)');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    activeIntervals.forEach((intervalId) => clearInterval(intervalId));
    server.close();
    process.exit(0);
});
