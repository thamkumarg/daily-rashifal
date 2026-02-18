/**
 * 🕉️ TKG RASHIFALA PUBLISHER - STABLE PRODUCTION VERSION
 * Fixes the 404/NOT_FOUND issue by prioritizing stable 'v1' endpoints and gemini-pro.
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = process.env.WP_USER || "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ GEMINI_API_KEY is missing!"); process.exit(1); }
    if (!wpPass) { console.error("❌ WP_PASS is missing!"); process.exit(1); }

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const npTime = new Date(utcTime + (5.75 * 60 * 60 * 1000));
    
    // मिति: ६ फागुन २०८२ (फेब्रुअरी १८, २०२६)
    const nepaliDateStr = "६ फागुन २०८२, मंगलबार"; 
    const englishDateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullDateDisplay = `${nepaliDateStr} (${englishDateStr})`;

    console.log(`🚀 Task Started for: ${fullDateDisplay}`);

    try {
        const content = await getAIContent(apiKey, fullDateDisplay);
        
        const htmlBody = `
<div style="font-family: 'Mukta', sans-serif; border: 2px solid #e53e3e; border-radius: 15px; padding: 25px; background-color: #fffaf0; max-width: 800px; margin: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://tkg.com.np/wp-content/uploads/2024/01/rashifal-banner.jpg" onerror="this.src='https://img.freepik.com/free-vector/zodiac-signs-wheel-astrology-background_1017-31362.jpg'" alt="Rashifal" style="width: 100%; border-radius: 10px;">
    </div>
    <h1 style="color: #c53030; text-align: center; font-size: 28px; margin-bottom: 10px;">आजको राशिफल</h1>
    <h3 style="color: #2d3748; text-align: center; font-weight: normal; margin-bottom: 25px;">मिति: ${fullDateDisplay}</h3>
    <div style="font-size: 19px; line-height: 1.9; color: #1a202c; text-align: justify;">
        ${content.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
    </div>
    <div style="margin-top: 30px; text-align: center; border-top: 2px solid #feb2b2; padding-top: 20px; color: #4a5568;">
        <p>प्रस्तुति: <b>त्रिकाल ज्ञान मार्ग (TKG)</b></p>
    </div>
</div>`;

        await postToWP(wpHost, wpUser, wpPass, `आजको राशिफल - ${nepaliDateStr}`, htmlBody);
        console.log("✅ Successfully published!");

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
        process.exit(1);
    }
}

async function getAIContent(key, date) {
    const configurations = [
        { version: 'v1', model: 'gemini-1.5-flash' },
        { version: 'v1beta', model: 'gemini-1.5-flash' },
        { version: 'v1', model: 'gemini-pro' }
    ];

    for (const config of configurations) {
        try {
            console.log(`🤖 Attempting ${config.model} (${config.version})...`);
            const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${key}`;
            const response = await makeRequest(url, {
                contents: [{ parts: [{ text: `Write daily horoscope for 12 zodiac signs in Nepali for ${date}. Format with bold names.` }] }]
            });
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
        } catch (e) {
            console.warn(`⚠️ Failed path: ${config.version}/${config.model}`);
        }
    }
    throw new Error("All endpoints failed. Check API key/quota.");
}

function makeRequest(apiUrl, payload) {
    return new Promise((resolve, reject) => {
        const req = https.request(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(data)) : reject(new Error(res.statusCode)));
        });
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

function postToWP(host, user, pass, title, content) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const postData = JSON.stringify({ title, content, status: 'publish' });
        const req = https.request({
            hostname: host, path: '/wp-json/wp/v2/posts', method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        }, (res) => res.statusCode === 201 ? resolve() : reject(new Error(res.statusCode)));
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

run();
