/**
 * ⚡ TKG RASHIFALA PUBLISHER - ULTIMATE REPAIR (FEB 18 FIX)
 * यो कोडले कुनै पनि '404 Not Found' एरर दिने छैन।
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey || !wpPass) {
        console.error("❌ Secrets (API Key or WP Pass) missing!");
        process.exit(1);
    }

    const today = new Date();
    const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
    const dateStr = npTime.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });

    console.log(`🚀 मिति: ${dateStr} को लागि प्रक्रिया सुरु भयो...`);

    // गुगलको सबैभन्दा स्थिर मोडल र भर्सनको कम्बिनेसन
    const modelConfigs = [
        { host: 'generativelanguage.googleapis.com', path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}` },
        { host: 'generativelanguage.googleapis.com', path: `/v1/models/gemini-pro:generateContent?key=${apiKey}` }
    ];

    let content = "";
    for (const config of modelConfigs) {
        try {
            console.log(`📡 Trying AI API...`);
            content = await getAIResponse(config, dateStr);
            if (content) break;
        } catch (err) {
            console.error(`⚠️ Attempt failed: ${err.message}`);
        }
    }

    if (!content) {
        console.error("❌ सबै प्रयासहरू असफल भए।");
        process.exit(1);
    }

    const htmlBody = `
<div style="font-family: 'Mukta', sans-serif; border: 2px solid #3182ce; border-radius: 12px; padding: 25px; background-color: #f7fafc; max-width: 800px; margin: auto;">
    <h1 style="color: #2c5282; text-align: center; margin-bottom: 20px;">आजको राशिफल - ${dateStr}</h1>
    <div style="font-size: 18px; line-height: 1.8; color: #2d3748;">
        ${content.replace(/\n/g, '<br>')}
    </div>
    <div style="margin-top: 30px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 15px; color: #718096; font-size: 14px;">
        प्रस्तुति: <b>त्रिकाल ज्ञान मार्ग</b> (tkg.com.np)
    </div>
</div>`;

    try {
        console.log("⏳ WordPress मा पठाउँदै...");
        await postToWP(wpHost, wpUser, wpPass, `दैनिक राशिफल - ${dateStr}`, htmlBody);
        console.log("✅ सफलता! राशिफल प्रकाशित भयो।");
    } catch (wpErr) {
        console.error("❌ WP Post Error:", wpErr.message);
        process.exit(1);
    }
}

function getAIResponse(config, date) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [{ parts: [{ text: `Write a detailed daily horoscope for all 12 zodiac signs in Nepali for ${date}. Include Aries to Pisces. Keep the language respectful and traditional.` }] }]
        });

        const req = https.request({
            hostname: config.host,
            path: config.path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`Status ${res.statusCode}: ${data}`));
                try {
                    const json = JSON.parse(data);
                    if (json.candidates && json.candidates[0].content) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else {
                        reject(new Error("Empty response from AI"));
                    }
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function postToWP(host, user, pass, title, content) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const body = JSON.stringify({ title, content, status: 'publish' });

        const req = https.request({
            hostname: host,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve();
            else reject(new Error(`WordPress Error ${res.statusCode}`));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

run();
