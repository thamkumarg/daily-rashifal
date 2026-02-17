/**
 * FINAL STABLE VERSION - BUILT-IN HTTPS MODULE (FIXED)
 * १. अङ्ग्रेजी मितिलाई एआई मार्फत सही नेपाली गतेमा परिवर्तन गर्ने।
 * २. वर्डप्रेस प्रमाणीकरणका लागि https मोड्युलको मानक प्रयोग।
 * ३. गिटहब एक्सन (Actions) को लागि पूर्ण रूपमा अनुकूलित।
 */

const https = require('https');

async function run() {
    const apiKey = process.env.GEMINI_API_KEY || ""; 
    const WP_URL = "tkg.com.np";
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
    const systemPrompt = `तपाईँ एक विशेषज्ञ ज्योतिष र नेपाली पात्रोको ज्ञाता हुनुहुन्छ। 
    आजको अंग्रेजी मिति ${englishDateStr} लाई सही नेपाली गतेमा बदल्नुहोस् र १२ राशिको फल <h3> र <p> ट्याग प्रयोग गरेर लेख्नुहोस्। 
    कुनै पनि भूमिका वा कोड ब्लक नलेख्नुहोस्। सिधै राशिफलबाट सुरु गर्नुहोस्।`;

    try {
        console.log(`Step 1: Fetching content from Gemini for ${englishDateStr}...`);
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `आजको अङ्ग्रेजी मिति ${englishDateStr} हो। यसको नेपाली गते पत्ता लगाई विस्तृत राशिफल दिनुहोस्।` }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await aiResponse.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!rawContent || rawContent.length < 100) throw new Error("AI Content Generation Failed.");

        // अनावश्यक क्यारेक्टर हटाउने
        rawContent = rawContent.replace(/```html/gi, '').replace(/```/g, '').replace(/\*\*/g, '').trim();

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; background: #000; color: #eee; padding: 25px; border: 1px solid #d4af37; border-radius: 12px; line-height: 1.6;">
                <h1 style="color: #d4af37; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">आजको राशिफल</h1>
                <p style="text-align: center; color: #aaa; font-size: 14px;">अपडेटेड: ${englishDateStr}</p>
                <div class="rashifal-body" style="margin-top: 20px;">${rawContent}</div>
                <div style="text-align: center; margin-top: 30px; border-top: 1px solid #333; padding-top: 15px; font-size: 12px; color: #666;">
                    © त्रिकाल ज्ञान मार्ग | tkg.com.np
                </div>
            </div>
        `;

        // ३. वर्डप्रेसमा पठाउने (https.request प्रयोग गरेर)
        console.log("Step 2: Publishing to WordPress...");
        const postData = JSON.stringify({
            title: `आजको दैनिक राशिफल - ${englishDateStr}`,
            content: finalHTML,
            status: 'publish',
            categories: [1]
        });

        const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
        
        const options = {
            hostname: WP_URL,
            port: 443,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'WordPress-Auto-Poster/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', (chunk) => { resBody += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`SUCCESS: Post Published Successfully! (Status: ${res.statusCode})`);
                } else {
                    console.error(`FAILED: WordPress rejected the request with Status ${res.statusCode}`);
                    console.error("Server Response:", resBody);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Network Error: ${e.message}`);
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.error("Critical Execution Error:", error.message);
    }
}

// Start execution
run();
