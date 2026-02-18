/**
 * 🕉️ TKG RASHIFALA - FINAL AUTO-RECOVERY SCRIPT
 * This script auto-detects available models to fix 404 errors.
 * Fix: Corrected Nepali Year to 2082 (for Feb 2026)
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
        
        // Find the best working model (Flash 1.5, or Pro, or any available)
        const selectedModel = modelsList.find(m => m.includes('gemini-1.5-flash')) || 
                             modelsList.find(m => m.includes('gemini-1.0-pro')) || 
                             modelsList[0];

        if (!selectedModel) throw new Error("No usable Gemini models found for this API key.");
        console.log(`✅ Auto-selected Model: ${selectedModel}`);

        // STEP 2: Generate Horoscope Content
        const rawContent = await generateAIContent(apiKey, selectedModel, fullDateDisplay);
        
        // Clean and Format Content for WordPress
        const htmlBody = `
<div style="font-family: 'Mukta', sans-serif; border: 2px solid #d32f2f; border-radius: 12px; padding: 20px; background-color: #ffffff; max-width: 750px; margin: auto;">
    <h1 style="color: #d32f2f; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px;">आजको राशिफल</h1>
    <p style="text-align: center; font-size: 1.1em; color: #555;"><b>मिति:</b> ${fullDateDisplay}</p>
    <div style="font-size: 18px; line-height: 1.8; color: #333; margin-top: 20px;">
        ${rawContent.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
    </div>
    <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
    <p style="text-align: center; color: #888; font-size: 14px;">© त्रिकाल ज्ञान मार्ग (TKG) - आध्यात्मिक यात्रा</p>
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

// Function to find which models are actually working
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

// Function to call AI with the auto-selected model
async function generateAIContent(key, modelPath, date) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${key}`;
    const payload = JSON.stringify({
        contents: [{
            parts: [{
                text: `Write a detailed daily horoscope in Nepali for all 12 zodiac signs for ${date}. 
                Format: Use Bold Sign Name with Emoji (e.g., ♈ **मेष**). 
                Include: General prediction, Lucky Color (शुभ रङ), and Lucky Number (शुभ अंक) for each sign. 
                Tone: Spiritual, helpful, and positive.`
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

// Function to post to WordPress
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
                    resolve(json.link); // Return the URL of the published post
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
