/**
 * 🕉️ TKG RASHIFALA PUBLISHER - ULTIMATE ROBUST VERSION (FIXED 404 & MODEL NOT FOUND)
 * This version uses a smart fallback mechanism to handle Google API Model Name changes.
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ GEMINI_API_KEY missing in GitHub Secrets!"); process.exit(1); }
    if (!wpPass) { console.error("❌ WP_PASS missing in GitHub Secrets!"); process.exit(1); }

    // मिति सेटिङ (फागुन ७, २०८१ - आजको लागि)
    const nepaliDateStr = "७ फागुन २०८१, बुधबार"; 
    const fullDateDisplay = `${nepaliDateStr} (February 18, 2026)`;

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
        console.log("✅ WordPress मा सफलतापुर्वक पब्लिश भयो!");

    } catch (err) {
        console.error("❌ Fatal Script Error:", err.message);
        process.exit(1);
    }
}

async function getAIContent(key, date) {
    // विभिन्न मोडेल नामहरू प्रयास गर्ने लिस्ट (४०४ एररबाट बच्न)
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    const prompt = `Write a very detailed daily horoscope for 12 zodiac signs in Nepali for ${date}. 
    Format each sign with an icon like ♈ **मेष:**. 
    Write 3-4 sentences for each sign. 
    At the end of each sign, include 'शुभ अंक' and 'शुभ रङ'. 
    Make the tone positive and astrological.`;

    for (const model of models) {
        try {
            console.log(`🤖 Attempting API with model: ${model}...`);
            const result = await makeApiCall(key, model, prompt);
            if (result) return result;
        } catch (e) {
            console.warn(`⚠️ Attempt failed for ${model}: ${e.message}`);
            // अर्को मोडेल प्रयास गर्न जारी राख्ने
        }
    }

    throw new Error("All AI model endpoints failed. Please check your API key and permissions.");
}

function makeApiCall(key, model, prompt) {
    // v1beta एन्डपोइन्टमा पूर्ण मोडेल पथ प्रयोग गरिएको छ
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    
    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };

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
                    else reject(new Error("Empty text in response"));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', e => reject(e));
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
                res.on('end', () => reject(new Error(`WP API Error ${res.statusCode}: ${body}`)));
            }
        });
        req.on('error', e => reject(e));
        req.write(postData);
        req.end();
    });
}

run();
