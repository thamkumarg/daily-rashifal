/**
 * 🕉️ TKG RASHIFALA - FINAL AUTO-RECOVERY SCRIPT
 * This script auto-detects available models to fix 404 errors.
 * Fix: Corrected Nepali Year to 2082 (for Feb 2026)
 * UI: Enhanced Premium Design for WordPress
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal"; // Your WP Username
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ API Key Missing in GitHub Secrets!"); process.exit(1); }

    // Today's Date Configuration - Updated to 2082 BS
    const nepaliDateStr = "७ फागुन २०८२, बुधबार"; 
    const fullDateDisplay = `${nepaliDateStr} (February 18, 2026)`;

    console.log(`🚀 Task Started for: ${fullDateDisplay}`);

    try {
        // STEP 1: Get the list of models your API Key is allowed to use
        console.log("🔍 Fetching allowed models for your API key...");
        const modelsList = await getAvailableModels(apiKey);
        
        // Find the best working model
        const selectedModel = modelsList.find(m => m.includes('gemini-1.5-flash')) || 
                             modelsList.find(m => m.includes('gemini-1.0-pro')) || 
                             modelsList[0];

        if (!selectedModel) throw new Error("No usable Gemini models found for this API key.");
        console.log(`✅ Auto-selected Model: ${selectedModel}`);

        // STEP 2: Generate Horoscope Content
        const rawContent = await generateAIContent(apiKey, selectedModel, fullDateDisplay);
        
        // Premium UI Formatting
        const htmlBody = `
<div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #fdfaf5; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🕉️ आजको राशिफल</h1>
        <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">${fullDateDisplay}</p>
    </div>

    <div style="padding: 30px; background: white;">
        <div style="font-size: 19px; line-height: 2; color: #2d3748; text-align: justify;">
            ${rawContent.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                
                // If the line starts with an emoji, it's a zodiac sign - style it as a card
                if (trimmed.match(/^[♈♉♊♋♌♍♎♏♐♑♒♓]/)) {
                    return `
                    <div style="background: #fffcf0; border-left: 5px solid #d32f2f; padding: 15px 20px; border-radius: 8px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <div style="font-size: 22px; color: #b71c1c; font-weight: bold; margin-bottom: 8px;">${trimmed.split(':')[0]}</div>
                        <div style="color: #4a5568;">${trimmed.split(':').slice(1).join(':').trim()}</div>
                    </div>`;
                }
                return `<p>${trimmed}</p>`;
            }).join('')}
        </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #edf2f7;">
        <p style="margin: 0; color: #718096; font-size: 15px;">प्रस्तुति: <b>त्रिकाल ज्ञान मार्ग (TKG)</b></p>
        <p style="margin: 5px 0 0; color: #a0aec0; font-size: 13px;">आध्यात्मिक मार्गदर्शन र ज्योतिषिय विश्लेषण</p>
    </div>
</div>`;

        // STEP 3: Post to WordPress
        console.log("📤 Sending to WordPress...");
        const postLink = await postToWP(wpHost, wpUser, wpPass, `आजको राशिफल - ${nepaliDateStr}`, htmlBody);
        console.log(`🎊 SUCCESS: Post published successfully!`);
        console.log(`🔗 Live Link: ${postLink}`);

    } catch (error) {
        console.error("❌ FATAL ERROR:", error.message);
        process.exit(1);
    }
}

async function getAvailableModels(key) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (!json.models) throw new Error("Invalid API Key or Permissions");
                    const names = json.models
                        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                        .map(m => m.name);
                    resolve(names);
                } catch (e) { reject(new Error("Failed to list models: " + data)); }
            });
        }).on('error', reject);
    });
}

async function generateAIContent(key, modelPath, date) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${key}`;
    const payload = JSON.stringify({
        contents: [{
            parts: [{
                text: `Write a detailed daily horoscope in Nepali for all 12 zodiac signs for ${date}. 
                Format: Each sign MUST start with its emoji and name in this format "♈ मेष: [description]". 
                Include: General prediction, Lucky Color (शुभ रङ), and Lucky Number (शुभ अंक) for each sign. 
                Keep the tone spiritual and positive.`
            }]
        }]
    });

    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) resolve(text);
                    else reject(new Error("AI returned empty content."));
                } catch (e) { reject(new Error("AI Generation Error: " + data)); }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function postToWP(host, user, pass, title, content) {
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
    const body = JSON.stringify({ title, content, status: 'publish' });

    return new Promise((resolve, reject) => {
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
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                if (res.statusCode === 201) {
                    const json = JSON.parse(responseData);
                    resolve(json.link);
                } else {
                    reject(new Error(`WordPress Rejected Post (Status: ${res.statusCode}) - ${responseData}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

run();
