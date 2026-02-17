/**
 * सुधारिएको र सिधा काम गर्ने script.js
 * १. जटिल पार्सिङ हटाएर सिधै 'Raw Content' लाई आकर्षक बनाइएको।
 * २. पोस्ट खाली हुने समस्याको पूर्ण अन्त्य।
 */

async function run() {
    const apiKey = ""; // API Key handled by environment
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    // एआईलाई सिधै HTML ढाँचामा उत्तर दिन निर्देशन
    const systemPrompt = `तपाईँ एक अनुभवी वैदिक ज्योतिष हुनुहुन्छ। 
    - १२ वटै राशिको फल अनिवार्य रूपमा लेख्नुहोस्।
    - प्रत्येक राशिलाई <h3> र <p> ट्याग प्रयोग गरेर HTML ढाँचामा लेख्नुहोस्।
    - शीर्षकमा राशिको नाम र चिन्ह (जस्तै ♈ मेष) राख्नुहोस्।
    - कुनै भूमिका वा गफ नलेख्नुहोस्। सिधै मेषबाट सुरु गरेर मीनमा अन्त्य गर्नुहोस्।`;

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
        const rawAIContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!rawAIContent) {
            console.error("AI returned nothing.");
            return;
        }

        // एआईबाट आएको सामग्रीलाई कालो ब्याकग्राउन्ड र सुनौलो अक्षरमा ढाल्ने
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: -50px auto 0 auto; background-color: #000; color: #eee; padding: 20px;">
                <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #d4af37; font-size: 32px; margin: 0;">आजको राशिफल</h1>
                    <p style="color: #888; font-size: 16px;">${fullDateStr}</p>
                </div>
                
                <style>
                    h3 { color: #d4af37 !important; border-left: 4px solid #d4af37; padding-left: 10px; margin-top: 25px !important; font-size: 22px !important; }
                    p { font-size: 18px !important; line-height: 1.7 !important; text-align: justify; color: #ccc !important; }
                </style>

                <div class="rashifal-body">
                    ${rawAIContent.replace(/\*\*/g, '')}
                </div>

                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; color: #555;">
                    © त्रिकाल ज्ञान मार्ग | तपाईँको आध्यात्मिक सहयात्री
                </div>
            </div>
        `;

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
            console.log("Success: Post published!");
        } else {
            console.error("WP Post Failed:", await wpRes.text());
        }

    } catch (error) {
        console.error("System Error:", error);
    }
}

run();
