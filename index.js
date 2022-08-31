// node index.js --url=https://www.hackerrank.com/access-account/ --config=config.json

let minimist = require("minimist");
let args = minimist(process.argv);
let puppeteer = require("puppeteer");
let fs = require("fs");

let configJSON = fs.readFileSync(args.config, "utf-8");
let config = JSON.parse(configJSON);

async function run() {
    let browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized'
        ],
        defaultViewport: null
    });
    let pages = await browser.pages();
    let page = pages[0];
    await page.goto(args.url);

    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    await page.waitForSelector("input[placeholder='Your username or email']");
    await page.type("input[placeholder='Your username or email']", config.username, { delay: 100 });
    await page.waitForSelector("input[type='password']");
    await page.type("input[type='password']", config.password, { delay: 100 });
    await page.waitForSelector("button[type='submit']");
    await page.click("button[type='submit']")

    await page.waitForSelector("a[href='/contests']")
    await page.click("a[href='/contests']");

    await page.waitForSelector("a[href='/administration/contests/']")
    await page.click("a[href='/administration/contests/']");

    await page.waitForSelector("a[data-attr1='Last']");
    let totalPages = await page.$eval("a[data-attr1='Last']",function(aTag){
        let pagesNum = parseInt(aTag.getAttribute("data-page"));
        return pagesNum;
    })
    
    for(let i =1;i<=totalPages;i++){
        await handleContestsInAPage(page, browser);

        if(i!=totalPages){
            await page.waitForSelector("a[data-attr1='Right']");
            await page.click("a[data-attr1='Right']");
        }
    }

}

async function handleContestsInAPage(page, browser) {
    await page.waitForSelector("a.backbone.block-center");
    let allContestsUrl = await page.$$eval("a.backbone.block-center", function (aTagArray) {
        let urls = [];
        for (let i = 0; i < aTagArray.length; i++) {
            let contestUrl = aTagArray[i].getAttribute("href");
            urls.push("https://www.hackerrank.com" + contestUrl);
        }
        return urls;
    })

    for (let i = 0; i < allContestsUrl.length; i++) {
        let newTab = await browser.newPage();
        await addModerator(newTab, allContestsUrl[i], config.moderator);
        await newTab.close();
        await page.waitFor(1000);
    }
}

async function addModerator(page, url, moderator) {
    await page.bringToFront();
    await page.goto(url);
    await page.waitFor(1000)

    await page.waitForSelector("li[data-tab='moderators']");
    await page.click("li[data-tab='moderators']");

    await page.waitForSelector("input#moderator");
    await page.type("input#moderator", moderator, { delay: 100 });

    await page.keyboard.press("Enter");
}
run();