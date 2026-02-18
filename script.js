/**
 * 🕉️ TKG RASHIFALA - FINAL STABLE VERSION
 * Fixes: 404 Model Not Found, Authentication, and Regional Issues.
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ API Key missing!"); process.exit(1); }
    if (!wpPass) { console.error("❌ WP Pass missing!"); process.exit(1); }

    const nepaliDateStr = "७ फागुन २०८१, बुधबार"; 
    const fullDateDisplay = `${nepaliDateStr} (February 18, 2026)`;

    console.log(`🚀 Starting for: ${fullDateDisplay}`);

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
        console.log("✅ Success! Rashifal published.");

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
        process.exit(1);
    }
}

async function getAIContent(key, date) {
    // एन्डपोइन्ट परिवर्तन: v1beta बाट v1 मा सिफ्ट गरिएको छ
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const prompt = `Write a detailed daily horoscope for 12 zodiac signs in Nepali for ${date}. 
    Format: ♈ **मेष:** (3-4 sentences). End with 'शुभ अंक' and 'शुभ रङ'. 
    Make it professional and optimistic for the TKG website.`;

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
                    else reject(new Error("Empty response from AI"));
                } else {
                    reject(new Error(`Google API ${res.statusCode}: ${data}`));
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
        const postData = JSON.stringify({
            title: title,
            content: content,
            status: 'publish',
            categories: [1] // तपाईँको राशिफल क्याटेगोरी ID हाल्नुहोला (optional)
        });

        const req = https.request({
            hostname: host,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                if (res.statusCode === 201) resolve();
                else reject(new Error(`WP Error ${res.statusCode}: ${body}`));
            });
        });

        req.on('error', e => reject(e));
        req.write(postData);
        req.end();
    });
}

run();
