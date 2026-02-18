/**
 * ⚡ TKG RASHIFALA PUBLISHER - ULTIMATE REPAIR (FEB 18 FINAL FIX)
 * This script handles multiple model fallbacks and optimized payload structure.
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

    // Array of potential model configurations to try
    const modelConfigs = [
        { ver: 'v1beta', model: 'gemini-1.5-flash' },
        { ver: 'v1beta', model: 'gemini-1.5-flash-latest' },
        { ver: 'v1', model: 'gemini-1.5-flash' }
    ];

    let content = "";
    let success = false;

    for (const config of modelConfigs) {
        try {
            console.log(`📡 Checking Model: ${config.model} (${config.ver})...`);
            content = await getAIResponse(config, apiKey, dateStr);
            
            if (content) {
                console.log(`✅ Success with ${config.model}!`);
                success = true;
                break;
            }
        } catch (err) {
            console.error(`⚠️ ${config.model} failed. Reason: ${err.message}`);
        }
    }

    if (!success || !content) {
        console.error("❌ All AI models failed. Please check your Gemini API Key billing/quota.");
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
        console.log("🎉 बधाई छ! सफलतापूर्वक प्रकाशित भयो।");
    } catch (wpErr) {
        console.error("❌ WP Post Error:", wpErr.message);
        process.exit(1);
    }
}

function getAIResponse(config, apiKey, date) {
    return new Promise((resolve, reject) => {
        const apiPath = `/${config.ver}/models/${config.model}:generateContent?key=${apiKey}`;
        
        // Using the most basic and reliable payload structure
        const payload = JSON.stringify({
            contents: [{ 
                parts: [{ 
                    text: `तपाईँ एक विशेषज्ञ ज्योतिषी हुनुहुन्छ। आजको मिति ${date} को लागि नेपाली भाषामा १२ राशिको विस्तृत दैनिक राशिफल लेख्नुहोस्। 
                    प्रत्येक राशिको नाम सुरुमा बोल्डमा लेख्नुहोस् (उदा: **मेष:**)। 
                    स्वास्थ्य, आर्थिक र पारिवारिक सम्बन्धको भविष्यवाणी र शुभ अंक/रङ समावेश गर्नुहोस्।` 
                }] 
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: apiPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
                }
                try {
                    const json = JSON.parse(data);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) resolve(text);
                    else reject(new Error("No text in AI response"));
                } catch (e) {
                    reject(new Error("JSON Parse Error"));
                }
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
        const body = JSON.stringify({
            title: title,
            content: content,
            status: 'publish'
        });

        const options = {
            hostname: host,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let resData = '';
            res.on('data', d => resData += d);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve();
                else reject(new Error(`WP status ${res.statusCode}: ${resData.substring(0, 100)}`));
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

run().catch(err => {
    console.error("Critical Failure:", err);
    process.exit(1);
});
