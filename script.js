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

    // मिति मिलाउने (शुद्ध नेपाली र अंग्रेजी ढाँचा)
    const today = new Date();
    // नेपाली समय (UTC+5:45)
    const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
    
    // नेपाली मिति: ६ फागुन २०८२
    const nepaliDate = npTime.toLocaleDateString('ne-NP', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // अंग्रेजी मिति: Feb 18, 2026
    const englishDate = npTime.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    // टाइटल र बडीको लागि पूर्ण मिति स्ट्रिङ - तपाईँले खोज्नुभएको ढाँचा
    const displayDate = `${nepaliDate} (${englishDate})`;

    console.log(`🚀 मिति: ${displayDate} को लागि प्रक्रिया सुरु भयो...`);

    const modelConfigs = [
        { ver: 'v1beta', model: 'gemini-1.5-flash' },
        { ver: 'v1beta', model: 'gemini-1.5-flash-latest' },
        { ver: 'v1', model: 'gemini-1.5-flash' }
    ];

    let content = "";
    let success = false;

    for (const config of modelConfigs) {
        try {
            console.log(`📡 Checking Model: ${config.model}...`);
            content = await getAIResponse(config, apiKey, displayDate);
            
            if (content && content.length > 500) {
                success = true;
                break;
            }
        } catch (err) {
            console.error(`⚠️ ${config.model} failed: ${err.message}`);
        }
    }

    if (!success || !content) {
        console.error("❌ AI failed to generate content.");
        process.exit(1);
    }

    const htmlBody = `
<div style="font-family: 'Mukta', sans-serif; border: 2px solid #3182ce; border-radius: 12px; padding: 25px; background-color: #f7fafc; max-width: 800px; margin: auto;">
    <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://img.freepik.com/free-vector/zodiac-signs-wheel-astrology-background_1017-31362.jpg" alt="Rashi Chakra" style="max-width: 100%; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
    </div>
    <h1 style="color: #2c5282; text-align: center; margin-bottom: 20px;">आजको राशिफल - ${displayDate}</h1>
    <div style="font-size: 18px; line-height: 1.8; color: #2d3748; text-align: justify;">
        ${content.replace(/\n/g, '<br>')}
    </div>
    <div style="margin-top: 30px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 15px; color: #718096; font-size: 14px;">
        प्रस्तुति: <b>त्रिकाल ज्ञान मार्ग</b> (tkg.com.np)
    </div>
</div>`;

    try {
        console.log("⏳ WordPress मा पठाउँदै...");
        const postTitle = `तपाईँको आजको राशिफल - ${displayDate}`;
        await postToWP(wpHost, wpUser, wpPass, postTitle, htmlBody);
        console.log("🎉 सफलतापूर्वक प्रकाशित भयो!");
    } catch (wpErr) {
        console.error("❌ WP Post Error:", wpErr.message);
        process.exit(1);
    }
}

function getAIResponse(config, apiKey, date) {
    return new Promise((resolve, reject) => {
        const apiPath = `/${config.ver}/models/${config.model}:generateContent?key=${apiKey}`;
        
        const payload = JSON.stringify({
            contents: [{ 
                parts: [{ 
                    text: `तपाईँ एक विशेषज्ञ ज्योतिषी हुनुहुन्छ। आजको मिति ${date} को लागि नेपाली भाषामा १२ राशिको विस्तृत दैनिक राशिफल तयार पार्नुहोस्। 
                    प्रत्येक राशिको नाम र चिन्ह **बोल्ड** मा लेख्नुहोस् (उदा: ♈ **मेष:**)। 
                    भविष्यफलमा स्वास्थ्य, आर्थिक अवस्था, र प्रेम सम्बन्धको बारेमा जानकारी दिनुहोस्। 
                    अन्त्यमा प्रत्येक राशिको शुभ अङ्क र शुभ रङ पनि उल्लेख गर्नुहोस्।` 
                }] 
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2500
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: apiPath,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
                try {
                    const json = JSON.parse(data);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) resolve(text);
                    else reject(new Error("Empty response"));
                } catch (e) { reject(new Error("Parse error")); }
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
                else reject(new Error(`WP Error ${res.statusCode}`));
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

run().catch(err => {
    console.error("FATAL ERROR:", err.message);
    process.exit(1);
});
