/**
 * 🕉️ TKG RASHIFALA - FINAL AUTO-RECOVERY SCRIPT
 * UI: Enhanced Premium Design for WordPress (Zodiac Cards Style)
 * Logic: Hard-coded Nepali Date Calculation to prevent Localization issues
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = process.env.WP_USER || "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ API Key Missing in GitHub Secrets!"); process.exit(1); }

    // --- भरपर्दो मिति र नेपाली मिति लजिक ---
    const daysOffset = 0; // भोलिको लागि १ राख्नुहोस्
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);

    // नेपाली बार र महिनाहरूको सूची
    const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
    const dayName = nepaliDays[targetDate.getDay()];
    
    // नेपाली गते निकाल्ने एउटा साधारण लजिक
    const getNepaliDate = (date) => {
        const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        const toNep = (n) => n.toString().split('').map(d => nepaliDigits[d]).join('');
        
        // सन् २०२६ फेब्रुअरी १८ को आसपासको गणना
        let nYear = toNep(2082);
        let nMonth = "फागुन";
        let nDay = toNep(7 + daysOffset); 
        
        return `${nMonth} ${nDay}, ${nYear}`;
    };

    const nepaliFullDate = getNepaliDate(targetDate);
    
    // प्रदर्शनको लागि केवल नेपाली मिति
    const fullDateDisplay = `${dayName}, ${nepaliFullDate}`;

    console.log(`🚀 Task Started for: ${fullDateDisplay}`);

    try {
        console.log("🔍 Fetching allowed models for your API key...");
        const modelsList = await getAvailableModels(apiKey);
        
        const selectedModel = modelsList.find(m => m.includes('gemini-1.5-flash')) || 
                             modelsList.find(m => m.includes('gemini-1.0-pro')) || 
                             modelsList[0];

        if (!selectedModel) throw new Error("No usable Gemini models found.");
        console.log(`✅ Using Model: ${selectedModel}`);

        const rawContent = await generateAIContent(apiKey, selectedModel, fullDateDisplay);
        
        const htmlBody = `
<div style="font-family: 'Mukta', serif; max-width: 800px; margin: auto; background-color: #fdf5e6; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 2px solid #d4af37;">
    <div style="background: #800000; padding: 40px 20px; text-align: center; color: #ffca28; border-bottom: 4px double #d4af37;">
        <h1 style="margin: 0; font-size: 38px; font-weight: bold; text-shadow: 1px 1px 2px #000;">🕉️ आजको राशिफल</h1>
        <p style="margin: 10px 0 0; font-size: 20px; color: #fff; font-weight: normal;">${fullDateDisplay}</p>
    </div>
    <div style="padding: 30px; background: #fffdf9;">
        <div style="font-size: 19px; line-height: 1.9; color: #1a1a1a;">
            ${rawContent.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                
                if (trimmed.match(/^[♈♉♊♋♌♍♎♏♐♑♒♓]/)) {
                    const parts = trimmed.split(':');
                    const rashiTitle = parts[0].trim();
                    let rashiDesc = parts.slice(1).join(':').trim();

                    // शुभ रङ र अंकलाई बक्स भित्रै स्टाइल गर्ने
                    rashiDesc = rashiDesc.replace(/(शुभ रङ[:\s]+[^\s,।]+)/g, '<br><span style="color:#800000; font-weight:bold; font-size:16px;">🎨 $1</span>');
                    rashiDesc = rashiDesc.replace(/(शुभ अंक[:\s]+[^\s,।]+)/g, '<span style="color:#800000; font-weight:bold; font-size:16px; margin-left:15px;">🔢 $1</span>');

                    return `
                    <div style="background: white; border: 1px solid #d4af37; border-radius: 10px; margin: 25px 0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <div style="background: #800000; padding: 12px 20px; color: #ffca28; font-size: 24px; font-weight: bold; border-bottom: 2px solid #d4af37;">
                            ${rashiTitle}
                        </div>
                        <div style="padding: 20px; color: #333; text-align: justify;">
                            ${rashiDesc}
                        </div>
                    </div>`;
                }
                return `<p style="margin-bottom: 15px; text-align: center; color: #5d4037; font-weight: bold;">${trimmed}</p>`;
            }).join('')}
        </div>
    </div>
    <div style="background: #800000; padding: 20px; text-align: center; border-top: 3px solid #d4af37; color: #fff;">
        <p style="margin: 0; font-size: 18px; color: #ffca28;"><b>त्रिकाल ज्ञान मार्ग (TKG)</b></p>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.8;">आध्यात्मिक चिन्तन र ज्योतिषिय विश्लेषण</p>
    </div>
</div>`;

        console.log("📤 Sending to WordPress...");
        const postLink = await postToWP(wpHost, wpUser, wpPass, `आजको राशिफल - ${fullDateDisplay}`, htmlBody);
        console.log(`🎊 SUCCESS: Published at ${postLink}`);

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        process.exit(1);
    }
}

async function getAvailableModels(key) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const names = json.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).map(m => m.name);
                    resolve(names);
                } catch (e) { reject(new Error("Model fetch failed")); }
            });
        }).on('error', reject);
    });
}

async function generateAIContent(key, modelPath, date) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${key}`;
    const payload = JSON.stringify({
        contents: [{
            parts: [{
                text: `Write a detailed daily horoscope in Nepali for all 12 zodiac signs for ${date}. 
                Format: Each sign MUST start with its emoji and name in this format "♈ मेष: [description]". 
                Inside description, at the end, MUST include: "शुभ रङ: [color]" and "शुभ अंक: [number]". 
                Tone: Spiritual and positive. Do not use markdown backticks.`
            }]
        }]
    });

    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.candidates[0].content.parts[0].text);
                } catch (e) { reject(new Error("AI Generation failed")); }
            });
        });
        req.write(payload);
        req.end();
    });
}

async function postToWP(host, user, pass, title, content) {
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
    const body = JSON.stringify({ title, content, status: 'publish' });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: host,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resData = '';
            res.on('data', d => resData += d);
            res.on('end', () => {
                if (res.statusCode === 201) resolve(JSON.parse(resData).link);
                else reject(new Error(`WP Error ${res.statusCode}`));
            });
        });
        req.write(body);
        req.end();
    });
}

run();
