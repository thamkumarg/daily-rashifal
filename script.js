/**
 * सुधारिएको script.js
 * १. कन्ट्यान्ट नदेखिने समस्याको पूर्ण समाधान (Universal Parsing)
 * २. राशीको नाम र विवरणलाई एकदमै टाइट बनाइएको।
 * ३. अलाइनमेन्ट र ग्यापलाई सुक्ष्म बनाइएको।
 */

async function run() {
    const apiKey = ""; // API Key handled by environment
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    const systemPrompt = `तपाईँ एक अनुभवी वैदिक ज्योतिष हुनुहुन्छ। 
    - १२ वटै राशिको फल अनिवार्य रूपमा लेख्नुहोस्।
    - प्रत्येक राशिको फल एक-एक अनुच्छेदमा लेख्नुहोस्।
    - राशिको नाम यसरी सुरु गर्नुहोस्: **♈ मेष राशि:**
    - कुनै भूमिका वा उपसंहार नलेख्नुहोस्। सिधै मेषबाट सुरु गरेर मीनमा अन्त्य गर्नुहोस्।`;

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
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        if (!rawContent || rawContent.length < 20) {
            console.error("AI did not return enough content.");
            return;
        }

        // Processing content for display
        const rashiNames = ["मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"];
        
        const processedContent = rawContent
            .trim()
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
                let cleanLine = line.replace(/\*\*/g, '').trim();
                
                // जाँच गर्ने: के यो लाइनमा कुनै राशीको नाम वा इमोजी छ?
                const isRashiLine = rashiNames.some(r => cleanLine.includes(r)) || line.match(/[♈-♓]/u);

                if (isRashiLine) {
                    // यदि राशीको नाम र विवरण सँगै छ भने (कोलन वा ड्यास प्रयोग भएको छ भने)
                    let title = "";
                    let description = "";
                    
                    if (cleanLine.includes(':')) {
                        let parts = cleanLine.split(':');
                        title = parts[0].trim();
                        description = parts.slice(1).join(':').trim();
                    } else if (cleanLine.includes('-')) {
                        let parts = cleanLine.split('-');
                        title = parts[0].trim();
                        description = parts.slice(1).join('-').trim();
                    } else {
                        // यदि केही पनि छैन भने पुरै लाइनलाई हेडलाइन मान्ने
                        title = cleanLine;
                    }

                    return `
                        <div style="margin-top: 15px;">
                            <div style="color: #d4af37; font-size: 21px; font-weight: bold; margin-bottom: 2px; border-left: 4px solid #d4af37; padding-left: 10px; display: block;">
                                ${title}
                            </div>
                            ${description ? `<p style="margin: 0 0 10px 0; text-align: justify; font-size: 17px; color: #ccc; padding-left: 14px; line-height: 1.6;">${description}</p>` : ''}
                        </div>`;
                }
                
                // यदि राशीको नाम छैन भने यो साधारण फल हो
                return `<p style="margin: 0 0 12px 0; text-align: justify; font-size: 17px; color: #ccc; padding-left: 14px; line-height: 1.6;">${cleanLine}</p>`;
            })
            .join('');

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 700px; margin: -50px auto 0 auto; background-color: #000; color: #eee; padding-bottom: 25px;">
                
                <!-- Header Section -->
                <div style="text-align: center; padding: 25px 0 15px 0; border-bottom: 1px solid #333; margin-bottom: 15px;">
                    <h2 style="color: #d4af37; font-size: 30px; margin: 0; padding: 0; text-transform: uppercase; font-weight: bold;">
                        आजको राशिफल
                    </h2>
                    <p style="font-size: 16px; color: #888; margin: 5px 0 0 0;">${fullDateStr}</p>
                </div>
                
                <!-- Main Content Area -->
                <div style="padding: 0 15px;">
                    ${processedContent}
                </div>

                <!-- Footer Section -->
                <div style="margin-top: 30px; padding: 15px; border-top: 1px solid #222; text-align: center; color: #555; font-size: 13px;">
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
                status: 'publish'
            })
        });

        if (wpRes.ok) {
            console.log("Successfully Published!");
        } else {
            console.error("WP Error:", await wpRes.text());
        }

    } catch (error) {
        console.error("Critical System Error:", error);
    }
}

run();
