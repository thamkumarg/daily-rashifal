/**
 * FINAL STABLE VERSION - RE-FIXED & SANITIZED
 * १. अङ्ग्रेजी मितिलाई एआई मार्फत सही नेपाली गतेमा परिवर्तन गर्ने।
 * २. वर्डप्रेस प्रमाणीकरण (Authentication) र कन्ट्यान्ट क्लिनिङमा सुधार।
 * ३. गिटहब एक्सन (Actions) को लागि पूर्ण रूपमा अनुकूलित।
 */

async function run() {
    const apiKey = process.env.GEMINI_API_KEY || ""; 
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS || "";

    if (!apiKey || !WP_PASS) {
        console.error("Error: API Key or WP Pass is missing in GitHub Secrets.");
        return;
    }

    // १. आजको अङ्ग्रेजी मिति लिने (नेपाली समय अनुसार)
    const today = new Date();
    const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
    const englishDateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // २. एआईका लागि कडा निर्देशन (Strict Formatting)
    const systemPrompt = `तपाईँ एक विशेषज्ञ ज्योतिष र नेपाली पात्रोको ज्ञाता हुनुहुन्छ। 
    - तपाईँको मुख्य काम आजको अंग्रेजी मितिलाई सही नेपाली गते (B.S.) मा बदल्नु र राशिफल लेख्नु हो।
    - उत्तर सिधै राशिफलबाट सुरु गर्नुहोस्।
    - १२ वटै राशिको फल अनिवार्य रूपमा <h3> र <p> ट्यागमा लेख्नुहोस्।
    - कुनै भूमिका, निष्कर्ष वा \`\`\`html जस्ता कोड ब्लकहरू नलेख्नुहोस्।`;

    const userQuery = `आज अङ्ग्रेजी मिति ${englishDateStr} हो। यसको सही नेपाली गते पत्ता लगाउनुहोस् र त्यस दिनको विस्तृत दैनिक राशिफल तयार पार्नुहोस्।`;

    try {
        console.log(`Step 1: Connecting to Gemini AI for ${englishDateStr}...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await response.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!rawContent || rawContent.length < 100) {
            throw new Error("AI returned insufficient or empty content.");
        }

        // कन्टेन्ट सफा गर्ने (Sanitization Fix)
        rawContent = rawContent
            .replace(/```html/gi, '')
            .replace(/```/g, '')
            .replace(/\*\*/g, '')
            .replace(/[\r\n]{2,}/g, '\n') // अनावश्यक खाली लाइन हटाउने
            .trim();

        // वर्डप्रेसको लागि अन्तिम डिजाइन
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 750px; margin: 0 auto; background-color: #000; color: #eee; padding: 25px; border: 1px solid #d4af37; border-radius: 10px;">
                <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 15px; margin-bottom: 25px;">
                    <h1 style="color: #d4af37; margin: 0; font-size: 28px;">आजको राशिफल</h1>
                    <p style="color: #888; font-size: 16px;">अटो-अपडेटेड: ${englishDateStr}</p>
                </div>
                <style>
                    .rashifal-body h3 { color: #d4af37 !important; border-left: 4px solid #d4af37; padding-left: 10px; margin-top: 25px !important; font-size: 22px !important; display: block; }
                    .rashifal-body p { font-size: 18px !important; line-height: 1.8 !important; text-align: justify; color: #ccc !important; margin-bottom: 15px !important; display: block; }
                </style>
                <div class="rashifal-body">
                    ${rawContent}
                </div>
                <div style="text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; color: #666; font-size: 13px;">
                    © त्रिकाल ज्ञान मार्ग | tkg.com.np
                </div>
            </div>
        `;

        console.log("Step 2: Sending post to WordPress...");
        // प्रमाणीकरण हेडर निर्माण
        const authHeader = 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

        const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'User-Agent': 'Node-Fetch/1.0',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                title: `आजको राशिफल - ${englishDateStr}`,
                content: finalHTML,
                status: 'publish',
                categories: [1],
                format: 'standard'
            })
        });

        if (wpRes.ok) {
            const resData = await wpRes.json();
            console.log(`SUCCESS: Post published! ID: ${resData.id} - URL: ${resData.link}`);
        } else {
            const errStatus = wpRes.status;
            const errText = await wpRes.text();
            console.error(`WordPress API Error (${errStatus}): ${errText}`);
            
            if(errStatus === 401) {
                console.error("Auth Failed: तपाईँको WP_PASS (Application Password) सही छ कि छैन पुन: जाँच्नुहोस्।");
            }
        }

    } catch (error) {
        console.error("Critical Error during execution:", error.message);
    }
}

run();
