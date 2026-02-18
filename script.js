/**
 * 🕉️ TKG RASHIFALA PUBLISHER - ULTIMATE ROBUST VERSION (FIXED 404)
 * This version uses the latest model naming conventions to fix the 404 NOT_FOUND issue
 * seen in GitHub Actions logs.
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ GEMINI_API_KEY is missing!"); process.exit(1); }
    if (!wpPass) { console.error("❌ WP_PASS is missing!"); process.exit(1); }

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const npTime = new Date(utcTime + (5.75 * 60 * 60 * 1000));
    
    // मिति: ६ फागुन २०८२
    const nepaliDateStr = "६ फागुन २०८२, मंगलबार"; 
    const englishDateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullDateDisplay = `${nepaliDateStr} (${englishDateStr})`;

    console.log(`🚀 Task Started for: ${fullDateDisplay}`);

    try {
        const content = await getAIContentWithFallback(apiKey, fullDateDisplay);
        
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
        console.log("✅ Successfully published to WordPress!");

    } catch (err) {
        console.error("❌ Fatal Script Error:", err.message);
        process.exit(1);
    }
}

async function getAIContentWithFallback(key, date) {
    /**
     * GitHub Actions मा ४०४ एरर आउनुको मुख्य कारण मोडलको नाम नमिल्नु हो।
     * यहाँ हामी 'latest' र विशिष्ट भर्सनहरू प्रयोग गर्छौँ।
     */
    const configurations = [
        { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}` },
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}` },
        { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}` }
    ];

    let lastError = "";

    for (const config of configurations) {
        const modelName = config.url.split('/models/')[1].split(':')[0];
        try {
            console.log(`🤖 Trying Model: ${modelName}...`);
            const result = await makeRequest(config.url, {
                contents: [{ parts: [{ text: `Write a detailed daily horoscope for all 12 zodiac signs in Nepali for ${date}. Start each sign with its emoji and bold name, e.g., ♈ **मेष:**. Include positive guidance for each.` }] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            });
            
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.length > 500) {
                console.log(`✨ Success with ${modelName}!`);
                return text;
            }
            console.warn(`⚠️ ${modelName} returned insufficient content.`);
        } catch (e) {
            lastError = e.message;
            console.warn(`❌ ${modelName} failed: ${e.message.substring(0, 100)}`);
        }
    }
    throw new Error(`All AI models failed. Last Error: ${lastError}. Please check if your API Key is restricted to certain regions.`);
}

function makeRequest(apiUrl, payload) {
    return new Promise((resolve, reject) => {
        const req = https.request(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 // 30 seconds timeout
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("Failed to parse JSON response")); }
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', (e) => reject(new Error(`Network Error: ${e.message}`)));
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
            headers: { 
                'Authorization': `Basic ${auth}`, 
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            if (res.statusCode === 201) resolve();
            else {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => reject(new Error(`WP Status ${res.statusCode}: ${body}`)));
            }
        });
        req.on('error', (e) => reject(new Error(`WP Connection Error: ${e.message}`)));
        req.write(postData);
        req.end();
    });
}

run();
