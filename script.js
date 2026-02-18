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

    // Array of potential model configurations to try - Updated with more robust versions
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
            
            if (content && content.length > 500) { // Ensuring we got a full response
                console.log(`✅ Success with ${config.model}!`);
                success = true;
                break;
            } else {
                console.warn(`⚠️ Short or invalid content from ${config.model}, trying next...`);
            }
        } catch (err) {
            console.error(`⚠️ ${config.model} failed. Reason: ${err.message}`);
        }
    }

    if (!success || !content) {
        console.error("❌ All AI models failed. This is likely due to API quota or safety filters.");
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
        
        // Advanced Payload with Safety Settings disabled to prevent blockages
        const payload = JSON.stringify({
            contents: [{ 
                parts: [{ 
                    text: `तपाईँ एक अनुभवी ज्योतिष हुनुहुन्छ। आजको मिति ${date} को लागि नेपाली भाषामा १२ राशिको विस्तृत दैनिक राशिफल तयार पार्नुहोस्। 
                    प्रत्येक राशिको नाम **बोल्ड** मा लेख्नुहोस्। 
                    भविष्यफलमा स्वास्थ्य, आर्थिक अवस्था, र प्रेम सम्बन्धको बारेमा सकारात्मक जानकारी दिनुहोस्। 
                    अन्त्यमा प्रत्येक राशिको शुभ अङ्क र शुभ रङ पनि उल्लेख गर्नुहोस्।` 
                }] 
            }],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2500,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
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
                    return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
                try {
                    const json = JSON.parse(data);
                    if (json.candidates && json.candidates[0].finishReason === "SAFETY") {
                        return reject(new Error("Content blocked by Safety Filters."));
                    }
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) resolve(text);
                    else reject(new Error("Response structure invalid or empty text."));
                } catch (e) {
                    reject(new Error("JSON Parse Error: " + e.message));
                }
            });
        });

        req.on('error', (e) => reject(new Error("Network Error: " + e.message)));
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
                else reject(new Error(`WP status ${res.statusCode}: ${resData.substring(0, 150)}`));
            });
        });

        req.on('error', (e) => reject(new Error("WordPress Connection Error: " + e.message)));
        req.write(body);
        req.end();
    });
}

run().catch(err => {
    console.error("FATAL ERROR:", err.message);
    process.exit(1);
});
