/**
 * ⚡ TKG RASHIFAL ENGINE - FINAL UNIVERSAL FIX
 * यो स्क्रिप्टले धेरै मोडल र API भर्सनहरू आफैं चेक गर्छ।
 * कुनै एउटा ४०४ भएमा अर्कोमा स्विच हुन्छ।
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    console.log("🔍 System Check Started...");
    if (!apiKey || !wpPass) {
        console.error("❌ API Key वा WordPress Password सेट गरिएको छैन!");
        process.exit(1);
    }

    const today = new Date();
    const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
    const dateStr = npTime.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });

    console.log(`🚀 मिति: ${dateStr} को तयारी हुँदैछ...`);

    // प्रयास गर्नुपर्ने मोडलहरूको लिस्ट (सबैभन्दा नयाँ देखि पुरानो सम्म)
    const modelOptions = [
        { version: 'v1beta', name: 'gemini-1.5-flash-latest' },
        { version: 'v1beta', name: 'gemini-1.5-pro-latest' },
        { version: 'v1', name: 'gemini-pro' },
        { version: 'v1beta', name: 'gemini-pro' }
    ];

    let aiContent = "";
    let success = false;

    for (const opt of modelOptions) {
        try {
            console.log(`📡 Trying: ${opt.name} (${opt.version})...`);
            aiContent = await getAIResponse(apiKey, dateStr, opt.version, opt.name);
            if (aiContent) {
                console.log(`✅ Success with ${opt.name}!`);
                success = true;
                break; 
            }
        } catch (e) {
            console.log(`⚠️ Failed: ${opt.name}. Moving to next...`);
        }
    }

    if (!success) {
        console.error("❌ कुनै पनि मोडलले काम गरेन। गुगल एआईमा केही ठूलो समस्या छ।");
        process.exit(1);
    }

    // पोस्ट गर्ने ढाँचा
    const postBody = `
<div style="font-family: 'Mukta', sans-serif; padding: 25px; border: 3px double #d4af37; border-radius: 20px; background-color: #fdfcf0; color: #222;">
    <h1 style="text-align: center; color: #b45309;">आजको राशिफल: ${dateStr}</h1>
    <div style="font-size: 19px; line-height: 1.8;">
        ${aiContent.replace(/\n/g, '<br>')}
    </div>
    <p style="text-align: center; margin-top: 30px; font-weight: bold; color: #555;">© त्रिकाल ज्ञान मार्ग | tkg.com.np</p>
</div>`;

    try {
        console.log("⏳ WordPress मा पठाउँदै...");
        await postToWP(wpHost, wpUser, wpPass, `दैनिक राशिफल - ${dateStr}`, postBody);
        console.log("🎉 बधाई छ! राशिफल सफलतापूर्वक प्रकाशित भयो।");
    } catch (err) {
        console.error(`❌ WordPress Error: ${err.message}`);
        process.exit(1);
    }
}

function getAIResponse(key, date, version, model) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [{ parts: [{ text: `Write the daily horoscope for all 12 signs in Nepali for ${date}. Format with bold sign names.` }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/${version}/models/${model}:generateContent?key=${key}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(data));
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.candidates[0].content.parts[0].text);
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
        const body = JSON.stringify({ title, content, status: 'publish', categories: [1] });

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
