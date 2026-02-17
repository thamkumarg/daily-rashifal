/**
 * FINAL STABLE VERSION - RE-FIXED
 * १. वर्डप्रेस प्रमाणीकरण (Authentication) र कन्ट्यान्ट क्लिनिङमा सुधार।
 * २. गिटहब एक्सन (Actions) को लागि पूर्ण रूपमा अनुकूलित।
 */

async function run() {
    // गिटहब सेक्रेट्सबाट डेटा तान्ने
    const apiKey = process.env.GEMINI_API_KEY || ""; 
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS || "";

    // यदि डेटा छैन भने रोकिने
    if (!apiKey || !WP_PASS) {
        console.error("Error: GEMINI_API_KEY or WP_PASS is not defined in environment variables.");
        return;
    }

    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    // एआईका लागि कडा निर्देशन
    const systemPrompt = `तपाईँ एक विशेषज्ञ ज्योतिष हुनुहुन्छ। 
    - १२ वटै राशिको फल अनिवार्य रूपमा लेख्नुहोस्।
    - प्रत्येक राशिको नाम र चिन्हलाई <h3> ट्यागमा राख्नुहोस्।
    - राशिफलको विवरणलाई <p> ट्यागमा राख्नुहोस्।
    - कुनै पनि भूमिका, गफ, वा 'यहाँ राशिफल छ' जस्ता वाक्य नलेख्नुहोस्।
    - उत्तरलाई कुनै पनि कोड ब्लक (\`\`\`html) भित्र नराख्नुहोस्। सिधै मेषबाट सुरु गरेर मीनमा अन्त्य गर्नुहोस्।`;

    const userQuery = `${fullDateStr} को लागि १२ राशिको विस्तृत दैनिक राशिफल तयार पार्नुहोस्।`;

    try {
        console.log("Connecting to Gemini AI...");
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

        // कन्टेन्ट सफा गर्ने (Unwanted characters filter)
        rawContent = rawContent
            .replace(/```html/gi, '')
            .replace(/```/g, '')
            .replace(/\*\*/g, '')
            .trim();

        // वर्डप्रेसको लागि अन्तिम डिजाइन
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 750px; margin: 0 auto; background-color: #000; color: #eee; padding: 25px; border: 1px solid #d4af37; border-radius: 10px;">
                <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 15px; margin-bottom: 25px;">
                    <h1 style="color: #d4af37; margin: 0; font-size: 28px;">आजको राशिफल</h1>
                    <p style="color: #aaa; font-size: 16px;">${fullDateStr}</p>
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

        console.log("Sending post to WordPress...");
        // Basic Auth Credentials
        const authHeader = 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

        const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `तपाईँको आज- ${vsDate}`,
                content: finalHTML,
                status: 'publish',
                categories: [1]
            })
        });

        if (wpRes.ok) {
            const resData = await wpRes.json();
            console.log(`SUCCESS: Post published! ID: ${resData.id}`);
        } else {
            const errText = await wpRes.text();
            console.error(`WordPress API Error (${wpRes.status}): ${errText}`);
        }

    } catch (error) {
        console.error("Critical Error during execution:", error.message);
    }
}

// Run the automation
run();
