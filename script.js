/**
 * ⚡ TKG RASHIFALA PUBLISHER - ULTIMATE REPAIR
 * यो स्क्रिप्टले काम नगर्ने सबै सम्भावित कारणहरूलाई हटाउँछ।
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey || !wpPass) {
        console.error("❌ Secrets not set correctly!");
        process.exit(1);
    }

    const today = new Date();
    const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
    const dateStr = npTime.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });

    console.log(`🚀 मिति: ${dateStr} को लागि काम सुरु भयो...`);

    // गुगलका सबै चल्ने मोडलहरूको सूची - पालैपालो चेक हुनेछ
    const models = [
        { ver: 'v1beta', name: 'gemini-1.5-flash' },
        { ver: 'v1', name: 'gemini-pro' },
        { ver: 'v1beta', name: 'gemini-pro' },
        { ver: 'v1', name: 'gemini-1.5-flash' }
    ];

    let content = "";
    let lastError = "";

    for (const model of models) {
        try {
            console.log(`📡 Trying Model: ${model.name} (${model.ver})...`);
            content = await getAIContent(apiKey, dateStr, model.ver, model.name);
            if (content) {
                console.log(`✅ Success with ${model.name}!`);
                break;
            }
        } catch (err) {
            lastError = err.message;
            console.log(`⚠️ ${model.name} failed, trying next...`);
        }
    }

    if (!content) {
        console.error("❌ सबै मोडल फेल भए। अन्तिम एरर:", lastError);
        process.exit(1);
    }

    const htmlContent = `
<div style="font-family: 'Mukta', sans-serif; border: 2px solid #e2e8f0; border-radius: 15px; padding: 20px; background: #fff;">
    <h2 style="color: #2d3748; text-align: center; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">आजको राशिफल - ${dateStr}</h2>
    <div style="font-size: 18px; line-height: 1.8; color: #4a5568;">
        ${content.replace(/\n/g, '<br>')}
    </div>
    <hr style="margin: 20px 0; border: 0; border-top: 1px dashed #cbd5e0;">
    <p style="text-align: center; font-size: 14px; color: #718096;">स्रोत: त्रिकाल ज्ञान मार्ग (tkg.com.np)</p>
</div>`;

    try {
        console.log("⏳ WordPress मा पोस्ट गर्दै...");
        await postToWP(wpHost, wpUser, wpPass, `दैनिक राशिफल - ${dateStr}`, htmlContent);
        console.log("🎉 सफलतापूर्वक प्रकाशित भयो!");
    } catch (wpErr) {
        console.error("❌ WP Post Error:", wpErr.message);
        process.exit(1);
    }
}

function getAIContent(key, date, ver, modelName) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [{ parts: [{ text: `Write the daily horoscope for all 12 zodiac signs in Nepali for ${date}. Format it clearly with sign names in bold.` }] }]
        });

        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/${ver}/models/${modelName}:generateContent?key=${key}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let str = '';
            res.on('data', chunk => str += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`Status ${res.statusCode}: ${str}`));
                try {
                    const json = JSON.parse(str);
                    resolve(json.candidates[0].content.parts[0].text);
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
            else reject(new Error(`WP status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

run();
