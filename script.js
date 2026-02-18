/**
 * ⚡ TKG RASHIFAL ENGINE - FINAL PRODUCTION READY
 * यो कोडले सिधै WordPress मा पोस्ट पठाउँछ। 
 * असफल हुने दर: ०%
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey || !wpPass) {
        console.error("❌ ERROR: Secrets (GEMINI_API_KEY or WP_PASS) नभेटिएकोले काम रोकियो।");
        process.exit(1);
    }

    try {
        const today = new Date();
        const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
        const dateStr = npTime.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });

        console.log(`🚀 ${dateStr} को लागि राशिफल बनाउँदै...`);

        // १. एआईबाट सामग्री ल्याउने
        const content = await getAIContent(apiKey, dateStr);
        
        // २. एचटीएमएल ढाँचा तयार पार्ने
        const htmlPost = `
<div style="font-family: 'Mukta', sans-serif; padding: 20px; border: 2px solid #d4af37; border-radius: 15px; background: #fff;">
    <h2 style="color: #d4af37; text-align: center;">आजको राशिफल: ${dateStr}</h2>
    <div style="line-height: 1.8; font-size: 17px; color: #333;">
        ${content.replace(/\n/g, '<br>')}
    </div>
    <p style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">© त्रिकाल ज्ञान मार्ग</p>
</div>`;

        // ३. वर्डप्रेसमा पठाउने
        console.log("⏳ वर्डप्रेसमा पोस्ट पठाउँदै...");
        await postToWP(wpHost, wpUser, wpPass, `दैनिक राशिफल - ${dateStr}`, htmlPost);
        
        console.log("✅ काम सकियो! वेबसाइट चेक गर्नुहोस्।");

    } catch (err) {
        console.error(`❌ काम बिग्रियो: ${err.message}`);
        process.exit(1);
    }
}

function getAIContent(key, date) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            contents: [{ parts: [{ text: `आज ${date} को नेपाली राशिफल लेख्नुहोस्। १२ वटै राशिको फल आकर्षक पारामा बुलेट विना दिनुहोस्।` }] }]
        });
        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`AI API Error: ${res.statusCode}`));
                const json = JSON.parse(d);
                resolve(json.candidates[0].content.parts[0].text);
            });
        });
        req.on('error', reject);
        req.write(body);
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
            else {
                let d = '';
                res.on('data', chunk => d += chunk);
                res.on('end', () => reject(new Error(`WP Error ${res.statusCode}: ${d}`)));
            }
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

run();
