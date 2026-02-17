/**
 * सुधारिएको script.js
 * १. कन्ट्यान्ट नदेखिने समस्याको पूर्ण समाधान (Universal Regex Parsing)
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
    - राशिको नाम र चिन्ह यसरी सुरु गर्नुहोस्: ♈ मेष राशि:
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
        
        if (!rawContent || rawContent.length < 50) {
            console.error("AI content empty or too short.");
            return;
        }

        const rashiNames = ["मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन"];
        
        /**
         * मुख्य सुधार: यदि एआईले सबै फलहरू एउटै प्याराग्राफमा पठाए पनि 
         * राशीको चिन्ह (♈-♓) भेट्ने बित्तिकै यसले नयाँ खण्ड बनाउँछ।
         */
        const segments = rawContent
            .replace(/([♈-♓])/gu, '\n$1') // चिन्हको अगाडि लाइन ब्रेक थप्ने
            .split('\n')
            .filter(line => line.trim().length > 5);

        const processedContent = segments.map(line => {
            let cleanLine = line.replace(/\*\*/g, '').trim();
            const isRashiLine = rashiNames.some(r => cleanLine.includes(r)) || line.match(/[♈-♓]/u);

            if (isRashiLine) {
                let title = "";
                let description = "";

                // टाइटल र विवरण छुट्याउने
                if (cleanLine.includes(':')) {
                    let parts = cleanLine.split(':');
                    title = parts[0].trim();
                    description = parts.slice(1).join(':').trim();
                } else if (cleanLine.includes('-')) {
                    let parts = cleanLine.split('-');
                    title = parts[0].trim();
                    description = parts.slice(1).join('-').trim();
                } else {
                    // यदि चिन्ह मात्र छ भने पहिलो २ शब्दलाई हेडलाइन मान्ने
                    let words = cleanLine.split(' ');
                    title = words.slice(0, 2).join(' ');
                    description = words.slice(2).join(' ');
                }

                return `
                    <div style="margin-top: 15px; border-bottom: 1px solid #111; padding-bottom: 8px;">
                        <div style="color: #d4af37; font-size: 21px; font-weight: bold; margin-bottom: 2px; border-left: 4px solid #d4af37; padding-left: 10px; display: block;">
                            ${title}
                        </div>
                        <p style="margin: 0; text-align: justify; font-size: 17px; color: #ccc; padding-left: 14px; line-height: 1.6;">
                            ${description}
                        </p>
                    </div>`;
            }
            return `<p style="margin: 8px 0; text-align: justify; font-size: 17px; color: #bbb; line-height: 1.6;">${cleanLine}</p>`;
        }).join('');

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 700px; margin: -55px auto 0 auto; background-color: #000; color: #eee; padding-bottom: 30px;">
                
                <div style="text-align: center; padding: 25px 0 15px 0; border-bottom: 1px solid #333; margin-bottom: 15px;">
                    <h2 style="color: #d4af37; font-size: 28px; margin: 0; padding: 0; text-transform: uppercase; font-weight: bold;">
                        आजको राशिफल
                    </h2>
                    <p style="font-size: 15px; color: #888; margin: 5px 0 0 0;">${fullDateStr}</p>
                </div>
                
                <div style="padding: 0 15px;">
                    ${processedContent}
                </div>

                <div style="margin-top: 30px; padding: 15px; border-top: 1px solid #222; text-align: center; color: #444; font-size: 12px;">
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
            console.log("Post published successfully!");
        } else {
            console.error("WP Error:", await wpRes.text());
        }

    } catch (error) {
        console.error("Critical error in run():", error);
    }
}

run();
