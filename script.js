/**
 * FINAL STABLE VERSION - BUILT-IN HTTPS MODULE
 * १. अङ्ग्रेजी मितिलाई एआई मार्फत सही नेपाली गतेमा परिवर्तन गर्ने।
 * २. वर्डप्रेस प्रमाणीकरणका लागि https मोड्युलको प्रयोग (High Reliability)।
 * ३. गिटहब एक्सन (Actions) को लागि पूर्ण रूपमा अनुकूलित।
 */

const https = require('https');

async function run() {
    const apiKey = process.env.GEMINI_API_KEY || ""; 
    const WP_URL = "tkg.com.np"; // URL मात्र (https:// हटाइएको)
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS || "";

    if (!apiKey || !WP_PASS) {
        console.error("Error: API Key or WP Pass is missing in GitHub Secrets.");
        return;
    }

    // १. आजको अङ्ग्रेजी मिति लिने
    const today = new Date();
    const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
    const englishDateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // २. एआईका लागि निर्देशन
    const systemPrompt = `तपाईँ एक विशेषज्ञ ज्योतिष र नेपाली पात्रोको ज्ञाता हुनुहुन्छ। आजको अंग्रेजी मिति ${englishDateStr} लाई सही नेपाली गतेमा बदल्नुहोस् र १२ राशिको फल <h3> र <p> ट्याग प्रयोग गरेर लेख्नुहोस्। कुनै भूमिका नलेख्नुहोस्।`;

    try {
        console.log(`Step 1: Fetching content from Gemini...`);
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `आज अङ्ग्रेजी मिति ${englishDateStr} हो। नेपाली गते सहित राशिफल दिनुहोस्।` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await aiResponse.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!rawContent || rawContent.length < 100) throw new Error("AI Content failed.");

        rawContent = rawContent.replace(/```html/gi, '').replace(/```/g, '').replace(/\*\*/g, '').trim();

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; background: #000; color: #eee; padding: 20px; border: 1px solid #d4af37; border-radius: 10px;">
                <h1 style="color: #d4af37; text-align: center;">आजको राशिफल</h1>
                <p style="text-align: center; color: #888;">अटो-अपडेट: ${englishDateStr}</p>
                <div class="rashifal-body">${rawContent}</div>
            </div>
        `;

        // ३. वर्डप्रेसमा पठाउने (https.request प्रयोग गरेर)
        console.log("Step 2: Publishing to WordPress via HTTPS module...");
        const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
        
        const postData = JSON.stringify({
            title: `आजको राशिफल - ${englishDateStr}`,
            content: finalHTML,
            status: 'publish',
            categories: [1]
        });

        const options = {
            hostname: WP_URL,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'NodeJS-Script'
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', (chunk) => { resBody += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`SUCCESS: Post published! Status: ${res.statusCode}`);
                } else {
                    console.error(`FAILED: WP Error Status ${res.statusCode}`);
                    console.error("Response:", resBody);
                }
            });
        });

        req.on('error', (e) => { console.error("Request Error:", e.message); });
        req.write(postData);
        req.end();

    } catch (error) {
        console.error("Execution Error:", error.message);
    }
}

run();
