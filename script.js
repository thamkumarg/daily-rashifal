/**
 * सुधारिएको script.js
 * १. कन्ट्यान्ट नदेखिने समस्या पूर्ण समाधान (Regex-based formatting)
 * २. राशीको नाम र विवरणलाई एकदमै नजिक ल्याइएको।
 * ३. अलाइनमेन्ट र ग्यापलाई सुक्ष्म बनाइएको।
 */

async function run() {
    const API_KEY = ""; // Environment key handled by system
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    const systemPrompt = `तपाईँ एक अनुभवी वैदिक ज्योतिष हुनुहुन्छ। 
    - प्रत्येक राशिको फल एक-एक अनुच्छेद (Paragraph) मा लेख्नुहोस्।
    - राशिको नाम यसरी सुरु गर्नुहोस्: **♈ मेष राशि:** - राशिफलको मुख्य विवरण त्यसकै पछि सुरु गर्नुहोस्।
    - शीर्षक वा अतिरिक्त कुराहरू केही पनि नलेख्नुहोस्।`;

    const userQuery = `${fullDateStr} को लागि संक्षिप्त र सटिक १२ राशिको दैनिक राशिफल तयार पार्नुहोस्।`;

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
        
        if (!rawContent) {
            console.error("No content generated from AI");
            return;
        }

        // HTML मा रूपान्तरण गर्दा राशीको नामलाई स्टाइल गर्ने
        // यसले **♈ मेष राशि:** जस्ता कुरालाई छुट्टै हेडलाइनमा बदल्छ
        const formattedContent = rawContent
            .trim()
            .replace(/\*\*(.*?)\*\*/g, (match, p1) => {
                return `<div style="color: #d4af37; font-size: 20px; font-weight: bold; margin-top: 18px; margin-bottom: 2px; border-left: 4px solid #d4af37; padding-left: 10px; display: block;">${p1}</div>`;
            })
            .split('\n')
            .filter(line => line.trim() !== "")
            .map(line => {
                if (line.includes('border-left')) return line; // यदि हेडलाइन हो भने सिधै पठाउने
                return `<p style="margin: 0 0 10px 0; text-align: justify; font-size: 17px; color: #ccc; padding-left: 14px; line-height: 1.6;">${line}</p>`;
            })
            .join('');

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 700px; margin: -35px auto 0 auto; background-color: #000; color: #eee;">
                
                <!-- Compact Header -->
                <div style="text-align: center; padding: 15px 0; border-bottom: 1px solid #333; margin-bottom: 15px;">
                    <h2 style="color: #d4af37; font-size: 28px; margin: 0; padding: 0; text-transform: uppercase;">
                        आजको राशिफल
                    </h2>
                    <p style="font-size: 14px; color: #999; margin: 2px 0 0 0;">${fullDateStr}</p>
                </div>
                
                <!-- Content Area -->
                <div style="padding: 0 15px;">
                    ${formattedContent}
                </div>

                <!-- Footer -->
                <div style="margin-top: 30px; padding: 15px; border-top: 1px solid #222; text-align: center; color: #666; font-size: 13px;">
                    © त्रिकाल ज्ञान मार्ग | डिजिटल ज्योतिष डायरी
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
                status: 'publish',
                format: 'standard'
            })
        });

        if (wpRes.ok) {
            console.log("Successfully Published!");
        } else {
            console.error("WP Error:", await wpRes.text());
        }

    } catch (error) {
        console.error("System Error:", error);
    }
}

// Global invocation
run();
