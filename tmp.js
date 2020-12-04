const puppeteer = require('puppeteer');
const util = require('util');
//const fetch = require('node-fetch')
let browser, page;

const {pay} = require('./test.js');

async function getWallets(isCall, number) {
    await page.goto('https://spk.jakksoft.com/wallet');
    console.log('goto');

    const label = 'label';
    await page.waitForSelector(label);
    await page.waitForSelector('tbody');

    const moneys = await page.$$eval(label, labels => labels.map(elem => elem.textContent).filter(elem => elem.includes("АР") && !elem.includes("*")));

    let example = await page.$$eval(label, labels => labels.map( (elem, i) => {
        if (elem.parentElement.style.textAlign == 'right' && elem.textContent != 'Имя карты') {
            return {
                name: elem.textContent,
                value: "",
                history: []
            };
        } else return null;
    }).filter(card => card != null));
    await page.waitForSelector('div[class=box]');

	let history = await page.evaluate(i => {
	    return Array.from($($('div[class=box]')[i].children[0]).find(".col-lg-12")).map(elem => {
            return {
                name: $($(elem).children().children()[2]).children().children().attr('data-original-title') == undefined ? $($(elem).children().children()[2]).children().attr('data-original-title') : $($(elem).children().children()[2]).children().children().attr('data-original-title'),
                value: $(elem).children().children()[0].innerText.trim(),
                description: $(elem).children().children()[1].innerText.trim()
            };
	    });
	}, number);
        example[number].history = history;
        example[number].value = moneys[number];
    //}
    console.log('getting');
    if (!isCall)
        page.close();
    return example[number];
};
let allUsers = [];
async function init () {
    //{headless: false});
    browser = await puppeteer.launch({headless: false, args: []});//{headless:false});
    // console.log(browser);
    // let context = await browser.createIncognitoBrowserContext();
    page = await browser.newPage();
    await page.setViewport({width: 1500, height: 1000});
    page.setCookie({name: 'PHPSESSID', value: '10c063d5780089d492613bbcd1d896bf', domain: 'spk.jakksoft.com'});
    //await page.goto('https://spk.jakksoft.com');
    await page.goto('https://spk.jakksoft.com/usersList');
    await page.waitForSelector('label[class=username]');
    allUsers = await page.evaluate(() => Array.from(document.querySelectorAll('label[class=username]')).map(el => el.innerText));
    // await page.screenshot({path: 'buddy-screenshot.png'});
    // console.time('a');
    // console.log(util.inspect(await getWallets(true, 1), false, null, true /* enable colors */));
    // console.timeEnd('a');
    // console.time('b');
    // console.log(util.inspect(await getWallets(true, 1), false, null, true /* enable colors */));
    // console.timeEnd('b'); 
}
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/work.html');
});
let timer;
let connectedUsers = {};
io.on('connection', async socket => {
    console.log('user connected');
    connectedUsers[JSON.parse('{"' + decodeURI(new URL(socket.request.headers.referer).search.substring(1).replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}').name] = socket;
    
    // console.log(socket.request.headers.referer);
    console.log(connectedUsers['Qugalet'].id);
    socket.join('widget');
    // connectedUsers['Qugalet'].emit('test', connectedUsers['Qugalet'].id);
});

let isFirst = true;
let previousDonats = [];
function getPayments(data) {
    // console.log(data);
    if (isFirst) {
        previousDonats = data;
        isFirst = false;
    } else {
        let diffffff = data.history.slice(0, -previousDonats.history.length).filter(el => el.value.trim()[0] == "+");
        // console.log(diffffff);
        if (diffffff.length > 0) {
	    previousDonats = data;
            return diffffff;
                // let search = location.search.substring(1);
                // console.log(element.description);
                // let params = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
                // if (element.description.startsWith(params.name)) {    
                // }
		
            
        } else return [];
    }
};


timer = setInterval(async () => {
    let numClients;
    await io.of('/').in('widget').clients((error,clients) => {
        
        numClients=clients.length;
    });
    // console.log(numClients)
    if (numClients > 0 ) {
        let wallets = await getWallets(true, 1);
	let users = getPayments(wallets);
	// console.log(users);
	await users.forEach(async user => {
	    let correctUser;
	    if (!allUsers.some(alluser => {if (user.description.startsWith(`!${alluser}!`)) {correctUser = alluser; return true;} else return false;})) {
		console.log('incorrect username!');
		await pay(await browser.newPage(), user.name, user.value, '!SPALERTS! Вы неверно ввели формат сообщения! Правильно: "!Ник на сайте! Сообщение"');
	    } else if (parseInt(user.value.slice(1)) <= 1) {
		console.log('too few money');
		await pay(await browser.newPage(), user.name, user.value, '!SPALERTS! Слишком маленький донат! Минимальное число: 2АР');
	    } else {
		console.log('username is correct!');
		let commission = parseInt(user.value.slice(1)) < 10 ? 1 : Math.ceil(parseInt(user.value.slice(1)) * 0.05);
		console.log((parseInt(user.value.slice(1)) - commission).toString());
		await pay(await browser.newPage(), correctUser, (parseInt(user.value.slice(1)) - commission).toString(), `!SPALERTS! Вам пришел донат от ${user.name}! Содержание: ${user.description.replace(`!${correctUser}!`, '')}. Коммисия: ${commission}АР`);
		// await new Promise(resolve => setTimeout(async () => , 200));
		await pay(await browser.newPage(), 'Qugalet', commission.toString(), "Коммисия с SPALERTS", 3);
		user.value = (parseInt(user.value.slice(1)) - commission).toString();
		user.description = user.description.replace(`!${correctUser}!`, '');
		if (Object.keys(connectedUsers).includes(correctUser))
		    connectedUsers[correctUser].emit('wallet', user);
	    }
	
	});
        // io.to('widget').emit('wallet', wallets); 
    }
}, 2000);


new Promise((resolve, reject) => setTimeout(async () => {await init(); resolve();}, 1000))
    .then(() => {
	http.listen(3000, async () => {	    
	    console.log('listening on *:3000');
	});
    });
