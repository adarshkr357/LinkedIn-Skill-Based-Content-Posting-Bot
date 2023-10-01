require('dotenv').config();
const config = require('./config.js');
const fs = require('fs');

const axios = require("axios");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

function capture(userString, first, last, isHtml = false) {
    const regex = new RegExp(`${first}(.*?)${last}`, 's');
    const match = userString.match(regex);
    if (match) {
        let result = match[1];
        if (!isHtml) {
            result = result.replace(/\s\s+/g, '').trim();
        }
        return result;
    }
    return null;
};

function recursiveCapture(userString, start, final, isHtml = false) {
    const regex = new RegExp(`${start}(.*?)${final}`, 'g');
    let matches = [...userString.matchAll(regex)].map(match => match[1]);

    if (!isHtml) {
        matches = matches.map(match => match.replace(/<[^>]*>?/gm, '').trim());
    }

    return matches;
};

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
};

function updateConfig() {
    const updatedConfig = JSON.stringify(config, null, 2); // Serialize the configuration object to JSON
    fs.writeFileSync('./config.js', `module.exports = ${updatedConfig};`, 'utf-8');
};

async function getContent() {
    const headers = {
        "authority": "scripai.com",
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.6",
        "content-type": "application/json",
        "origin": "https://scripai.com",
        "referer": "https://scripai.com/linkedin-post",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
    };

    const data = {
        prompt: {
            title: randomChoice(config.skills) + " " + randomChoice(config.post_title_suffix),
            description: randomChoice(config.post_description),
            keywords: randomChoice(config.post_keywords),
            platform: "LinkedIn",
            language: randomChoice(config.post_language),
            tone: randomChoice(config.post_tone)
        },
        slug: "linkedin-post"
    };
    let contentHttpRequestBlock;
    while (true) {
        try {
            contentHttpRequestBlock = await axios.post("https://scripai.com/api/getGPTdata", data, {
                headers
            });
            break;
        } catch (e) {
            continue;
        }
    };
    const contentBlockResponse = contentHttpRequestBlock.data;
    if (!JSON.stringify(contentBlockResponse).includes('"result":"\\n\\n')) {
        return false;
    };
    return contentBlockResponse.result;
};

async function postContent() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Specify your chrome path.
        headless: "new" // Make it false (headless: false) if there are too many errors.
    });
    const pages = await browser.pages();
    const page = pages[0];

    await page.goto("https://www.linkedin.com/login", {
        waitUntil: 'networkidle0'
    });

    await page.type('#username', process.env.linkedin_email);
    await page.type('#password', process.env.linkedin_pass);
    await page.click('button[aria-label="Sign in"]');

    const loginHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url() == 'https://www.linkedin.com/checkpoint/lg/login-submit');

    if (parseInt(loginHttpRequestBlock.status().toString().substr(0, 1)) != 3) {
        const loginBlockResponse = await loginHttpRequestBlock.text();
        if (loginBlockResponse.includes("Wrong email")) {
            console.error("Incorrect email entered.");
        } else if (loginBlockResponse.includes("right password")) {
            console.error("Incorrect password entered.");
        } else {
            console.error(`Unknown error occured, here's the response: ${loginBlockResponse}`);
        };
        await browser.close();
        process.exit();
    };

    let dashboardHttpRequestBlock;

    try {
        dashboardHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url() == 'https://www.linkedin.com/feed/', {
            timeout: 5000 // Increase it if your connection is slow.
        });
    } catch (error) {
        console.error(`Ip banned / Slow connection speed.`);
        await browser.close();
        process.exit();
    };

    const dashboardBlockResponse = await dashboardHttpRequestBlock.text();

    if (!dashboardBlockResponse.includes('recent_activity_nav_all&quot;,&quot;actionTarget&quot;:&quot;https://www.linkedin.com/')) {
        console.error(`Unknown error occured, here's the response: ${dashboardBlockResponse}`);
        await browser.close();
        process.exit();
    };

    // Add skills automatically in config.js if not found.
    if (config.skills.length < 1) {
        const username = capture(dashboardBlockResponse, 'recent_activity_nav_all&quot;,&quot;actionTarget&quot;:&quot;https://www.linkedin.com/', '/recent-activity/&quot;,');

        await page.goto(`https://www.linkedin.com/${username}/details/skills/`);

        const skillHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url().includes('/api/graphql?includeWebMetadata=true&variables=(profileUrn') && httpRequest.url().includes('sectionType:skills'));
        const skillBlockResponse = await skillHttpRequestBlock.text();
        await page.goBack();

        if (!skillBlockResponse.includes('"accessibilityText":"Edit ')) {
            console.error(`Unknown error occured, here's the response: ${skillBlockResponse}`);
            await browser.close();
            process.exit();
        };

        const skillLists = recursiveCapture(skillBlockResponse, '"accessibilityText":"Edit ', '",');
        config.skills = [...new Set(skillLists)];
        updateConfig();
    };

    await page.waitForSelector('.artdeco-button.artdeco-button--muted.artdeco-button--4.artdeco-button--tertiary.ember-view.share-box-feed-entry__trigger');
    await page.click('.artdeco-button.artdeco-button--muted.artdeco-button--4.artdeco-button--tertiary.ember-view.share-box-feed-entry__trigger');

    const checkContentResponse = await getContent();

    if (!checkContentResponse) {
        console.error(`Unknown error occured, here's the response: ${checkContentResponse}`);
        await browser.close();
        process.exit();
    };

    await page.type('.ql-editor', checkContentResponse.substr(2)); // Removing the \n\n from response
    await page.waitForTimeout(2000); // Wait for button to be clickable
    await page.click('.share-actions__primary-action.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view');
    await browser.close();

    return true;
};

(async () => {
    let nextPostTimestamp = 0;
    while (true) {
        const currentTimestamp = Date.now();
        if (currentTimestamp >= nextPostTimestamp) {
            const checkPostContentBlock = await postContent();
            if (checkPostContentBlock) {
                nextPostTimestamp = (currentTimestamp + ((Math.floor(Math.random() * 2) + 1) * 60 * 60 * 1000)) + 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
            };
        };
    };
})();