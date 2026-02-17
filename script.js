/**
 * ⚡ FINAL PROMISE-BASED STABLE VERSION (NO EXTERNAL DEPENDENCIES)
 * १. अङ्ग्रेजी मितिलाई एआई मार्फत सही नेपाली गतेमा परिवर्तन गर्ने।
 * २. एआई सामग्री नआउन्जेल पर्खने (Async/Await Fix)।
 * ३. वर्डप्रेस प्रमाणीकरणका लागि पूर्ण रूपमा सुरक्षित नेटिभ https मोड्युल।
 */

const https = require('https');

// एआईबाट सामग्री ल्याउने फङ्सन (Native HTTPS प्रयोग गरेर)
function fetchAIContent(apiKey, englishDateStr) {
    return new Promise((resolve, reject) => {
        const aiPayload = JSON.stringify({
            contents: [{ parts: [{ text: `आजको मिति ${englishDateStr} हो। यसको नेपाली गते पत्ता लगाई १२ राशिको विस्तृत फल लेख्नुहोस्।` }] }],
            systemInstruction: { parts: [{ text: `तपाईँ विशेषज्ञ ज्योतिष हुनुहुन्छ। राशिफल <h3> र <p> ट्यागमा लेख्नुहोस्। भूमिका नलेख्नुहोस्।` }] }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(aiPayload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) resolve(content);
                    else reject(new Error("AI Content is empty: " + data));
                } catch (e) { reject(new Error("Parsing Error: " + e.message)); }
            });
        });

        req.on('error', (e) => reject(new Error("Request Error: " + e.message)));
        req.write(aiPayload);
        req.end();
    });
}

// वर्डप्रेसमा पब्लिश गर्ने फङ्सन
function publishToWP(host, user, pass, dateStr, content) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            title: `आजको दैनिक राशिफल - ${dateStr}`,
            content: content,
            status: 'publish',
            categories: [1]
        });

        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const options = {
            hostname: host,
            port: 443,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'WordPress/6.0; NodeJS'
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', (d) => { resBody += d; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve(resBody);
                else reject(new Error(`WP Status ${res.statusCode}: ${resBody}`));
            });
        });

        req.on('error', (e) => reject(new Error("WP Request Error: " + e.message)));
        req.write(postData);
        req.end();
    });
}

async function run() {
    const apiKey = process.env.GEMINI_API_KEY || ""; 
    const WP_HOST = "tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = (process.env.WP_PASS || "").replace(/\s+/g, '').trim();

    if (!apiKey || !WP_PASS) {
        console.error("❌ Critical Error: Missing Secrets (GEMINI_API_KEY or WP_PASS).");
        return;
    }

    try {
        const today = new Date();
        const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
        const englishDateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        console.log(`🚀 Step 1: Fetching AI Content for ${englishDateStr}...`);
        let rawContent = await fetchAIContent(apiKey, englishDateStr);
        
        // सरसफाई
        rawContent = rawContent.replace(/```html/gi, '').replace(/```/g, '').trim();

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; background: #000; color: #eee; padding: 25px; border: 1px solid #d4af37; border-radius: 12px;">
                <h1 style="color: #d4af37; text-align: center;">आजको दैनिक राशिफल</h1>
                <p style="text-align: center; color: #888;">मिति: ${englishDateStr}</p>
                <div style="margin-top: 20px;">${rawContent}</div>
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #555;">© त्रिकाल ज्ञान मार्ग</div>
            </div>
        `;

        console.log(`📤 Step 2: Publishing to ${WP_HOST}...`);
        await publishToWP(WP_HOST, WP_USER, WP_PASS, englishDateStr, finalHTML);
        console.log(`✅ SUCCESS: Published Successfully!`);

    } catch (error) {
        console.error("❌ CRITICAL ERROR:", error.message);
    }
}

run();
