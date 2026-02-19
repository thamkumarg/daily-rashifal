/**
 * 🕉️ TKG RASHIFALA - DATE FIXED VERSION
 * Corrected: Feb 19, 2026 = Phalgun 7, 2082
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = (process.env.WP_USER || "trikal").trim(); 
    const wpUrl = "https://tkg.com.np";

    if (!apiKey || !wpPass) {
        console.error("❌ Secrets Missing!");
        process.exit(1);
    }

    // --- मिति मिलाउने सही तरिका (Correct Date Logic) ---
    const today = new Date(); 
    const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
    const dayName = nepaliDays[today.getDay()];

    // सन् २०२६ फेब्रुअरी १३ मा फागुन १ गते पर्छ
    // त्यसैले फेब्रुअरी १९ भनेको (१९ - १३ + १) = ७ गते हो।
    const phalgunFirst = new Date("2026-02-13");
    const diffTime = today - phalgunFirst;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const nDay = 1 + diffDays; 
    const fullDateDisplay = `${dayName}, फागुन ${nDay}, २०८२`;

    console.log("Generating for: " + fullDateDisplay);

    try {
        const rawContent = await generateAIContent(apiKey, fullDateDisplay);
        const cleanedContent = rawContent.replace(/नमस्ते|आजको पञ्चाङ्ग|यो राशिफल|नोट:।/g, "").trim();

        const htmlBody = `
<div style="font-family: 'Mukta', sans-serif; background: #fdfdfd; max-width: 800px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
    
    <div style="background: #8b0000; padding: 30px 20px; text-align: center; color: #fff; border-bottom: 4px solid #ccaa2b;">
        <h1 style="margin: 0; font-size: 36px; font-weight: 800; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
            आजको राशिफल
        </h1>
        <p style="margin: 10px 0 0 0; font-size: 20px; color: #f1f1f1;">${fullDateDisplay}</p>
    </div>

    <div style="padding: 25px;">
        <div class="rashifal-content">
            ${formatRashifal(cleanedContent)}
        </div>
    </div>

    <div style="background: #fffaf0; padding: 25px; text-align: center; border-top: 1px solid #eee;">
        <p style="font-weight: 800; color: #8b0000; margin: 0; font-size: 22px;">त्रिकाल ज्ञान मार्ग – आध्यात्मिक मार्गदर्शन</p>
        <p style="color: #777; font-size: 15px; margin-top: 5px;">जय सन्तोषी माता!</p>
    </div>
</div>`;

        const postData = {
            title: `आजको राशिफल: ${fullDateDisplay}`,
            content: htmlBody,
            status: 'publish',
            featured_media: 526,
            categories: [5]
        };

        const result = await publishToWP(wpUrl, wpUser, wpPass, postData);
        console.log("✅ Success! Live at: " + result.link);
        
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

function formatRashifal(text) {
    const zodiacs = ['मेष','वृष','मिथुन','कर्कट','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
    return text.split('\n').map(line => {
        const trimmed = line.trim();
        if(!trimmed) return "";
        
        if(zodiacs.some(z => trimmed.includes(z))) {
            return `<div style="background: #8b0000; color: #fff; padding: 12px 20px; border-radius: 8px 8px 0 0; margin-top: 30px; font-size: 22px; font-weight: 700; border-left: 8px solid #ccaa2b;">${trimmed.replace(/\*/g, '')}</div>`;
        }
        return `<div style="background: #fff; padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; margin-bottom: 10px; line-height: 1.8; color: #333; font-size: 17px; text-align: justify;">${trimmed.replace(/\*/g, '')}</div>`;
    }).join('');
}

async function publishToWP(url, user, pass, postData) {
    const endpoint = `${url}/wp-json/wp/v2/posts`;
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');
    return new Promise((resolve, reject) => {
        const options = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` } };
        const req = https.request(endpoint, options, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => res.statusCode === 201 ? resolve(JSON.parse(data)) : reject(new Error(`WP: ${res.statusCode}`)));
        });
        req.on('error', reject); req.write(JSON.stringify(postData)); req.end();
    });
}

async function generateAIContent(key, date) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`;
    const payload = {
        contents: [{ parts: [{ text: `आजको मिति ${date} को लागि १२ राशिको विस्तृत र सकारात्मक राशिफल लेख्नुहोस्। मेषबाट सुरु गर्नुहोला।` }] }],
        systemInstruction: { parts: [{ text: "You are a professional Vedic Astrologer for TKG (Trikal Knowledge Gateway). Use respectful and pure Nepali language." }] }
    };
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.candidates[0].content.parts[0].text);
                } catch(e) { reject(new Error("AI Parsing Error")); }
            });
        });
        req.on('error', reject); req.write(JSON.stringify(payload)); req.end();
    });
}

run();
