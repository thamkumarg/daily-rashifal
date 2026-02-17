/**
 * सुधारिएको script.js
 * राशीहरूबीचको अनावश्यक स्पेस हटाइएको र फन्ट साइज समान बनाइएको छ।
 */

async function run() {
    const API_KEY = process.env.GEMINI_API_KEY;
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    // मिति र समय सेटिङ
    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    const systemPrompt = `तपाईँ वैदिक ज्योतिष हुनुहुन्छ। १२ राशिको फल लेख्नुहोस्।
    - प्रत्येक राशिको नाम यसरी लेख्नुहोस्: ♈ **मेष राशि**
    - विवरणपछि शुभ अंक र रङ लेख्नुहोस्।
    - राशीहरू बीच धेरै खाली लाइन नछोड्नुहोस्।
    - सिधै मुख्य सामग्री मात्र दिनुहोस्।`;

    const userQuery = `${fullDateStr} को राशिफल तयार पार्नुहोस्।`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await response.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // अनावश्यक स्पेस सफा गर्ने
        rawContent = rawContent.trim().replace(/\n{3,}/g, '\n\n');

        // HTML बनाउने - फन्ट र स्पेस मिलाइएको
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #000; color: #eee; padding: 40px 20px; border: 1px solid #1a1a1a;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #d4af37; font-size: 42px; margin-bottom: 10px; line-height: 1.2;">
                        आजको राशिफल
                    </h1>
                    <p style="font-size: 20px; color: #888; margin: 0;">${fullDateStr}</p>
                    <div style="width: 60px; height: 2px; background: #d4af37; margin: 20px auto;"></div>
                </div>
                
                <!-- Horoscope Content -->
                <div style="font-size: 20px; line-height: 1.6; text-align: justify;">
                    ${rawContent
                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #d4af37; font-size: 22px; display: block; margin-top: 25px; margin-bottom: 10px;">$1</strong>')
                        .replace(/\n/g, '<br>')}
                </div>

                <!-- Footer -->
                <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #222; text-align: center; color: #666; font-size: 16px;">
                    BY त्रिकाल ज्ञान मार्ग | TKG TODAY
                </div>
            </div>
        `;

        const credentials = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
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

        if (wpRes.ok) console.log("Post published successfully!");
        else console.log("Post failed:", await wpRes.text());

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
