/**
 * 🕉️ TKG RASHIFALA PUBLISHER - ULTIMATE STABLE VERSION
 * Fixes the 404 "Model Not Found" error by using Stable v1 API.
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ API Key missing!"); process.exit(1); }
    if (!wpPass) { console.error("❌ WP Pass missing!"); process.exit(1); }

    // आजको मिति (७ फागुन २०८१ - Wednesday)
    const nepaliDateStr = "७ फागुन २०८१, बुधबार"; 
    const fullDateDisplay = `${nepaliDateStr} (February 18, 2026)`;

    console.log(`🚀 Script started for: ${fullDateDisplay}`);

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
        console.log("✅ Success! Post published on TKG.");

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
        process.exit(1);
    }
}

async function getAIContent(key, date) {
    // एन्डपोइन्ट र मोडेलको कम्बिनेशन (४०४ बाट बच्न)
    const configs = [
        { ver: 'v1', model: 'gemini-1.5-flash' },     // Stable version (Recommended)
        { ver: 'v1beta', model: 'gemini-1.5-flash' }, // Beta fallback
        { ver: 'v1', model: 'gemini-pro' }            // Legacy stable fallback
    ];

    const prompt = `Write a detailed daily horoscope for 12 zodiac signs in Nepali for ${date}. 
    Format: ♈ **मेष:** (3-4 sentences). At the end of each sign: 'शुभ अंक' and 'शुभ रङ'. 
    Tone: Professional, Positive, Astrological.`;

    for (const config of configs) {
        try {
            console.log(`🤖 Trying ${config.ver} with ${config.model}...`);
            const result = await makeApiCall(key, config.ver, config.model, prompt);
            if (result) return result;
        } catch (e) {
            console.warn(`⚠️ Failed: ${e.message}`);
        }
    }

    throw new Error("All Google AI endpoints returned errors. Check API quota or Key restrictions.");
}

function makeApiCall(key, version, model, prompt) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
    
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
    });

    return new Promise((resolve, reject) => {
        const req = https.request(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(data);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) resolve(text);
                    else reject(new Error("Response has no text content"));
                } else {
                    reject(new Error(`API ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', e => reject(e));
        req.write(payload);
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
                res.on('end', () => reject(new Error(`WP API ${res.statusCode}: ${body}`)));
            }
        });
        req.on('error', e => reject(e));
        req.write(postData);
        req.end();
    });
}

run();
