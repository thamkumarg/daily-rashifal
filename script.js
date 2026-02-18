/**
 * ⚡ TKG RASHIFALA PUBLISHER - ULTIMATE REPAIR (FEB 18 FINAL FIX)
 * यो कोडले ६ वटा फरक-फरक मोडल र भर्सनहरू पालैपालो चेक गर्छ।
 * कुनै एउटा ४०४ वा एरर भएमा तुरुन्तै अर्कोमा स्विच हुनेछ।
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

    // गुगलका सबै चल्न सक्ने सम्भावित बाटोहरूको सुची
    // केही भर्सनमा 'models/' अगाडि '/' चाहिन्छ, केहीमा चाहिँदैन, त्यसैले path निर्माणमा ध्यान दिइएको छ
    const modelConfigs = [
        { ver: 'v1beta', model: 'gemini-1.5-flash-latest' },
        { ver: 'v1beta', model: 'gemini-1.5-flash' },
        { ver: 'v1', model: 'gemini-1.5-flash' },
        { ver: 'v1beta', model: 'gemini-pro' },
        { ver: 'v1', model: 'gemini-pro' },
        { ver: 'v1', model: 'gemini-1.0-pro' }
    ];

    let content = "";
    let success = false;
    let errorLog = "";

    for (const config of modelConfigs) {
        try {
            const apiPath = `/${config.ver}/models/${config.model}:generateContent?key=${apiKey}`;
            console.log(`📡 Checking: ${config.model} (${config.ver})...`);
            
            content = await getAIResponse(apiPath, dateStr);
            
            if (content) {
                console.log(`✅ Success with ${config.model}!`);
                success = true;
                break;
            }
        } catch (err) {
            errorLog += `[${config.model}]: ${err.message} | `;
            console.log(`⚠️ ${config.model} failed, skipping...`);
        }
    }

    if (!success || !content) {
        console.error("❌ सबै प्रयासहरू असफल भए। लगहरू:", errorLog);
        process.exit(1);
    }

    // HTML Content Formatting
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
        console.log("🎉 बधाई छ! सफलता पूर्वक प्रकाशित भयो।");
    } catch (wpErr) {
        console.error("❌ WP Post Error:", wpErr.message);
        process.exit(1);
    }
}

function getAIResponse(path, date) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [{ 
                parts: [{ 
                    text: `Write a detailed daily horoscope for all 12 zodiac signs in Nepali for ${date}. 
                    Format each zodiac sign name in bold like **Mesh:**. 
                    Include predictions for health, wealth, and career.` 
                }] 
            }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
                try {
                    const json = JSON.parse(data);
                    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else {
                        reject(new Error("AI returned an unexpected format."));
                    }
                } catch (e) {
                    reject(new Error("JSON Parse Error"));
                }
            });
        });

        req.on('error', (e) => reject(e));
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
            res.on('data', (d) => { resData += d; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`WP status ${res.statusCode}: ${resData}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

// प्रक्रिया सुरु गर्ने
run().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
