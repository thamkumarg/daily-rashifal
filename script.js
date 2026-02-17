/**
 * FINAL STABLE VERSION
 * १. एआईलाई सिधै वर्डप्रेसले बुझ्ने सरल एचटीएमएल (Simple HTML) मा उत्तर दिन लगाइएको।
 * २. गिटहब एक्सन (Actions) बाट सिधै रन हुने गरी इन्धन मिलाइएको।
 */

async function run() {
    const apiKey = process.env.GEMINI_API_KEY || ""; 
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS || "";

    if (!apiKey || !WP_PASS) {
        console.error("Error: Environment Variables (API Key or WP Pass) missing!");
        return;
    }

    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    // एआईलाई कडा निर्देशन: सिधै बडी कन्टेन्ट मात्र पठाउनु
    const systemPrompt = `तपाईँ एक विशेषज्ञ ज्योतिष हुनुहुन्छ। 
    - १२ वटै राशिको फल अनिवार्य रूपमा लेख्नुहोस्।
    - प्रत्येक राशिको नाम र चिन्हलाई <h3> ट्यागमा राख्नुहोस्।
    - राशिफलको विवरणलाई <p> ट्यागमा राख्नुहोस्।
    - कुनै पनि भूमिका, गफ, वा 'यहाँ राशिफल छ' जस्ता वाक्य नलेख्नुहोस्।
    - उत्तरलाई \`\`\`html जस्ता कोड ब्लक भित्र नराख्नुहोस्। सिधै मेषबाट सुरु गरेर मीनमा अन्त्य गर्नुहोस्।`;

    const userQuery = `${fullDateStr} को लागि १२ राशिको विस्तृत दैनिक राशिफल तयार पार्नुहोस्।`;

    try {
        console.log("Fetching content from Gemini AI...");
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
            throw new Error("AI returned empty or invalid content.");
        }

        // एआईले झुक्किएर पठाउन सक्ने फालतू चिन्हहरू सफा गर्ने
        rawContent = rawContent.replace(/```html|```/g, '').replace(/\*\*/g, '').trim();

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 750px; margin: 0 auto; background-color: #000; color: #eee; padding: 25px; border: 1px solid #d4af37; border-radius: 10px;">
                <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 15px; margin-bottom: 25px;">
                    <h1 style="color: #d4af37; margin: 0; font-size: 28px;">आजको राशिफल</h1>
                    <p style="color: #aaa; font-size: 16px;">${fullDateStr}</p>
                </div>
                <style>
                    h3 { color: #d4af37 !important; border-left: 4px solid #d4af37; padding-left: 10px; margin-top: 25px !important; font-size: 22px !important; }
                    p { font-size: 18px !important; line-height: 1.8 !important; text-align: justify; color: #ccc !important; margin-bottom: 15px !important; }
                </style>
                <div class="rashifal-body">
                    ${rawContent}
                </div>
                <div style="text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; color: #666; font-size: 13px;">
                    © त्रिकाल ज्ञान मार्ग | tkg.com.np
                </div>
            </div>
        `;

        console.log("Publishing to WordPress...");
        const credentials = btoa(`${WP_USER}:${WP_PASS}`);
        const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `तपाईँको आज- ${vsDate}`,
                content: finalHTML,
                status: 'publish',
                categories: [1] // तपाईँको राशिफल क्याटेगोरीको ID यहाँ राख्न सक्नुहुन्छ
            })
        });

        if (wpRes.ok) {
            console.log("SUCCESS: Post published to tkg.com.np");
        } else {
            const errData = await wpRes.json();
            console.error("WordPress API Error:", JSON.stringify(errData));
        }

    } catch (error) {
        console.error("Process Failed:", error.message);
    }
}

run();
