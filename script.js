/**
 * ⚡ ULTIMATE STABLE VERSION - GUARANTEED RESULT
 * १. अङ्ग्रेजी मितिलाई एआई मार्फत सही नेपाली गतेमा परिवर्तन गर्ने।
 * २. वर्डप्रेस प्रमाणीकरणका लागि सबैभन्दा भरपर्दो https मोड्युल।
 * ३. गिटहब एक्सन (Actions) को लागि पूर्ण रूपमा अनुकूलित।
 */

const https = require('https');

async function run() {
    const apiKey = process.env.GEMINI_API_KEY || ""; 
    const WP_HOST = "tkg.com.np";
    const WP_USER = "trikal";
    // पासवर्डबाट सबै खाली ठाउँहरू हटाउने र ट्रिम गर्ने
    const WP_PASS = (process.env.WP_PASS || "").replace(/\s+/g, '').trim();

    if (!apiKey || !WP_PASS) {
        console.error("Critical Error: API Key or WP_PASS is missing in Secrets.");
        return;
    }

    // १. आजको मिति (नेपाल समय)
    const today = new Date();
    const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
    const englishDateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // २. एआईबाट सामग्री लिने
    const systemPrompt = `तपाईँ एक विशेषज्ञ ज्योतिष हुनुहुन्छ। मिति ${englishDateStr} को लागि सही नेपाली गते सहित १२ राशिको फल <h3> र <p> ट्याग प्रयोग गरेर लेख्नुहोस्। भूमिका नलेख्नुहोस्।`;

    try {
        console.log(`Step 1: Fetching AI Content...`);
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `आजको मिति ${englishDateStr} को लागि विस्तृत नेपाली राशिफल दिनुहोस्।` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await aiResponse.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!rawContent || rawContent.length < 100) throw new Error("AI Content is empty.");

        rawContent = rawContent.replace(/```html/gi, '').replace(/```/g, '').trim();

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; background: #000; color: #eee; padding: 25px; border: 1px solid #d4af37; border-radius: 12px;">
                <h1 style="color: #d4af37; text-align: center;">आजको दैनिक राशिफल</h1>
                <p style="text-align: center; color: #888;">मिति: ${englishDateStr}</p>
                <div style="margin-top: 20px;">${rawContent}</div>
            </div>
        `;

        // ३. वर्डप्रेस पब्लिशिङ (Final Fix)
        const postData = JSON.stringify({
            title: `आजको दैनिक राशिफल - ${englishDateStr}`,
            content: finalHTML,
            status: 'publish',
            categories: [1]
        });

        const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
        
        console.log(`Step 2: Publishing to ${WP_HOST}...`);

        const options = {
            hostname: WP_HOST,
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
            res.on('data', (chunk) => { resBody += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ SUCCESS: Post Published! Status: ${res.statusCode}`);
                } else {
                    console.error(`❌ FAILED: Status ${res.statusCode}`);
                    console.error("Response:", resBody);
                }
            });
        });

        req.on('error', (e) => { console.error(`Network Error: ${e.message}`); });
        req.write(postData);
        req.end();

    } catch (error) {
        console.error("Critical Execution Error:", error.message);
    }
}

run();
