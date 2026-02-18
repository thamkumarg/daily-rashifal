/**
 * 🕉️ TKG RASHIFALA - FINAL AUTO-RECOVERY SCRIPT
 * This script auto-detects available models to fix 404 errors.
 * Fix: Corrected Nepali Year to 2082 (for Feb 2026)
 * UI: Enhanced Premium Design for WordPress (Zodiac Cards Style)
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
<div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #eee;">
    <!-- Header Banner -->
    <div style="background: #b71c1c; padding: 30px 15px; text-align: center; color: white; border-bottom: 5px solid #ffca28;">
        <h1 style="margin: 0; font-size: 32px; letter-spacing: 1px;">🕉️ आजको राशिफल</h1>
        <p style="margin: 5px 0 0; font-size: 18px; font-weight: 300;">${fullDateDisplay}</p>
    </div>

    <div style="padding: 25px; background: #fffcf7;">
        <div style="font-size: 18px; line-height: 1.8; color: #333;">
            ${rawContent.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                
                // Styling the Zodiac Signs as separate prominent cards
                if (trimmed.match(/^[♈♉♊♋♌♍♎♏♐♑♒♓]/)) {
                    return `
                    <div style="background: white; border: 1px solid #ffe0b2; border-radius: 12px; margin: 20px 0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.03);">
                        <div style="background: #fff8e1; padding: 10px 20px; border-bottom: 1px solid #ffe0b2; color: #d32f2f; font-size: 22px; font-weight: bold;">
                            ${trimmed.split(':')[0]}
                        </div>
                        <div style="padding: 15px 20px; color: #444; text-align: justify;">
                            ${trimmed.split(':').slice(1).join(':').trim()}
                        </div>
                    </div>`;
                }
                return `<p style="margin-bottom: 15px;">${trimmed}</p>`;
            }).join('')}
        </div>
    </div>

    <!-- Footer Credit -->
    <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee; color: #666;">
        <p style="margin: 0; font-size: 16px;"><b>त्रिकाल ज्ञान मार्ग (TKG)</b></p>
        <p style="margin: 5px 0 0; font-size: 13px;">तपाईँको दिन शुभ रहोस् ।</p>
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
                Inside description, clearly list: 
                - Prediction paragraph
                - शुभ रङ: [Color Name]
                - शुभ अंक: [Number]
                Keep the tone spiritual, professional and positive.`
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
