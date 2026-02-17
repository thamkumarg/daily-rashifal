/**
 * सुधारिएको र सिधा काम गर्ने script.js
 * १. एआईको कन्ट्यान्टबाट अनावश्यक कोड ब्लकहरू (```html) सफा गर्ने लजिक थपिएको।
 * २. प्रत्येक राशिको लागि बोर्डर र ग्याप मिलाइएको।
 * ३. पोस्ट खाली हुने समस्याको पूर्ण अन्त्य।
 */

async function run() {
    const apiKey = ""; // API Key handled by environment
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    // मिति सेटिङ
    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    // एआईलाई सिधै HTML ढाँचामा उत्तर दिन निर्देशन (जटिल टुक्रा पार्ने काम एआईलाई नै सुम्पिएको)
    const systemPrompt = `तपाईँ एक अनुभवी वैदिक ज्योतिष हुनुहुन्छ। 
    - १२ वटै राशिको फल अनिवार्य रूपमा लेख्नुहोस्।
    - प्रत्येक राशिको शीर्षकलाई <h3> र फललाई <p> ट्यागमा राख्नुहोस्।
    - शीर्षक यसरी लेख्नुहोस्: ♈ मेष राशि
    - उत्तर सिधै पठाउनुहोस्, कुनै \`\`\`html वा अन्य कोड ब्लक भित्र नराख्नुहोस्।
    - कुनै गफ नलेख्नुहोस्। सिधै मेषबाट सुरु गरेर मीनमा अन्त्य गर्नुहोस्।`;

    const userQuery = `${fullDateStr} को लागि १२ राशिको विस्तृत दैनिक राशिफल तयार पार्नुहोस्।`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await response.json();
        let rawAIContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!rawAIContent || rawAIContent.length < 50) {
            console.error("AI returned insufficient content.");
            return;
        }

        // एआईले पठाउन सक्ने अनावश्यक कोड ढाँचाहरू सफा गर्ने
        rawAIContent = rawAIContent
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .replace(/\*\*/g, '') // बोल्ड स्टारहरू हटाउने
            .trim();

        // वेबसाइटमा देखिने डिजाइन (Black & Gold Theme)
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: 0 auto; background-color: #000; color: #eee; padding: 25px; border-radius: 15px; border: 1px solid #222;">
                <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #d4af37; font-size: 32px; margin: 0; font-weight: bold;">आजको दैनिक राशिफल</h1>
                    <p style="color: #888; font-size: 17px; margin-top: 5px;">${fullDateStr}</p>
                </div>
                
                <style>
                    .rashifal-body h3 { 
                        color: #d4af37 !important; 
                        border-left: 5px solid #d4af37; 
                        padding: 12px 15px; 
                        margin-top: 25px !important; 
                        font-size: 24px !important; 
                        background: #111;
                        border-radius: 0 10px 10px 0;
                    }
                    .rashifal-body p { 
                        font-size: 19px !important; 
                        line-height: 1.8 !important; 
                        text-align: justify; 
                        color: #ccc !important; 
                        margin-bottom: 20px !important;
                        padding-left: 5px;
                    }
                </style>

                <div class="rashifal-body">
                    ${rawAIContent}
                </div>

                <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 14px;">
                    © त्रिकाल ज्ञान मार्ग | डिजिटल ज्योतिष डायरी
                </div>
            </div>
        `;

        // वर्डप्रेसमा पठाउने
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
                status: 'publish'
            })
        });

        if (wpRes.ok) {
            console.log("Success: Post published to tkg.com.np!");
        } else {
            console.error("WP Post Failed:", await wpRes.text());
        }

    } catch (error) {
        console.error("Critical System Error:", error);
    }
}

// तत्काल कार्यान्वयन
run();
