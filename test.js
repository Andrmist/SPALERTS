const puppeteer = require('puppeteer');


async function pay(page, to, value, message, idx=0) {
    // browser = await puppeteer.launch({headless: false, args: []});//{headless:false});
    // console.log(browser);
    // let context = await browser.createIncognitoBrowserContext();
    // await page.setViewport({width: 1500, height: 1000});
    // page.setCookie({name: 'PHPSESSID', value: '10c063d5780089d492613bbcd1d896bf', domain: 'spk.jakksoft.com'});
    await page.goto('https://spk.jakksoft.com/wallet');
    await page.waitForSelector('body > div.container > div.row.aos-init.aos-animate > div.col-12.col-lg-4 > div > button');
    await page.$eval('body > div.container > div.row.aos-init.aos-animate > div.col-12.col-lg-4 > div > button', el => el.click());
    console.log('clicked');
    await page.waitForSelector('#transaction > div > div > form > div.modal-body > div:nth-child(1) > div.col-lg-8 > select');
    await page.select('#transaction > div > div > form > div.modal-body > div:nth-child(1) > div.col-lg-8 > select', '741');
    await page.waitForSelector('#transaction > div > div > form > div.modal-body > div:nth-child(2) > div.col-lg-8 > input');
    let returnedd;
    return new Promise((res, rej) => setTimeout(async () => {
	await page.click('#transaction > div > div > form > div.modal-body > div:nth-child(2) > div.col-lg-8 > input')
	    .then(async () => {
		await page.keyboard.type(to, {delay: 20});
	    }).then(async () => {
		await page.keyboard.press('Tab');
		console.log('tabbed');
	    })
	    .then(async () => {
		await page.waitForSelector("#transaction > div > div > form > div.modal-body > div.row.to_id_row > div.col-lg-8.to_id_container > select");
		let eval = await page.evaluate((id) => {
		    let select = document.querySelector("#transaction > div > div > form > div.modal-body > div.row.to_id_row > div.col-lg-8.to_id_container > select");
		    if (select == null) return false;
		    //return select.textContent;
		    // for (let i = 0; i < select.length; i++) {
		    // if (select[i].textContent === card)
		    select[id].selected = true;
		    return true;
		    // Или вот на это, если там присутствует html, например:
		    // if (select[i].innerHTML === '<p>Терпила</p>') select[i].selected = true;
		    }, idx);
		if (!eval) {
		    await page.close();
		    res('{"error": "walletorusernotfound"}');
		} else {
		    await page.type('#transaction > div > div > form > div.modal-body > div:nth-child(5) > div.col-lg-8 > input', value.toString());
		    await page.type('#transaction > div > div > form > div.modal-body > div:nth-child(6) > div.col-lg-8 > textarea', message);
		    await page.click('#transaction > div > div > form > div.modal-footer > button');
		    await page.close();
		    res(true);
		}
	    });
    // }, 500);
    // await setTimeout(async () => {
	
    }, 500)).then(returned => {return returned;});
    // await page.click('#transaction > div > div > form > div.modal-body > div:nth-child(2) > div.col-lg-8 > input');
    // await page.$eval('#transaction > div > div > form > div.modal-body > div:nth-child(2) > div.col-lg-8 > input', (element, to) => {
    // 	element.value = to;
    // }, to);
    // await page.waitForSelector('#transaction > div > div > form > div.modal-body > div.row.to_id_row > div.col-lg-8.to_id_container > select');
    // console.log('waited for cards');
    // return returnedd;		
    
};
// (async () => {
//     let browser = await puppeteer.launch({headless: false, args: []});
//     console.log(await pay(await browser.newPage(),'Qugalet', 1, 'Донат от Qugalet к Qugalet: test'));
// })();

module.exports.pay = pay;
