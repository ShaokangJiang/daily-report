const solarLunar = require("solarlunar");
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const moment = require('moment-timezone');
const urlencode = require('urlencode');
const cookie = require('cookie');
const HTMLParser = require('node-html-parser');
const core = require('@actions/core');


const dotenv = require("dotenv")

dotenv.config()

const { APP_TOKEN: APP_TOKEN, UID: UID } = process.env;

if (APP_TOKEN.localeCompare("") == 0 || UID.localeCompare("") == 0) {
    core.setFailed(`Action failed because of empty required secrets.`);
}

core.info("");

function getYear(str) {
    return parseInt(str.split("-")[0]);
}

function getMonth(str) {
    return parseInt(str.split("-")[1]);
}

function getDay(str) {
    return parseInt(str.split(" ")[0].split("-")[2]);
}

function getHour(str) {
    return parseInt(str.split(" ")[1].split(":")[0]);
}

function getMinute(str) {
    return parseInt(str.split(":")[1]);
}

function getSeconds(str) {
    return parseInt(str.split(":")[2]);
}


async function sendMessage(message) {
    let uids = [];
    for (let i of UID.split(";")) {
        if (i.length != 0)
            uids.push(i);
    }
    let response = await fetch("http://wxpusher.zjiecode.com/api/send/message", {
        "headers": {
            "accept": "*/*",
            "content-type": "application/json"
        },
        "body": JSON.stringify({
            "appToken": APP_TOKEN,
            "content": message,
            "contentType": 1,//内容类型 1表示文字  2表示html(只发送body标签内部的数据即可，不包括body标签) 3表示markdown 
            "uids": uids,
            "url": undefined //原文链接，可选参数
        }),
        "method": "POST"
    });

    return await response.json();
}

function replaceAll(originalString, find, replace) {
    return originalString.replace(new RegExp(find, 'g'), replace);
}


function getTime() {
    var timeCST = moment().tz('America/Chicago').format("YYYY-MM-DD HH:mm:ss");
    var timeBeijing = moment().tz('Asia/Shanghai').format("YYYY-MM-DD HH:mm:ss");
    //console.log(timeCST);
    //console.log(timeBeijing);
    let str = "[" + getYear(timeBeijing) + "年" + getMonth(timeBeijing) + "月" + getDay(timeBeijing) + "日" +
        getHour(timeBeijing) + "点" + getMinute(timeBeijing) + "分" + getSeconds(timeBeijing) + "秒\n";
    const solar2lunarData = solarLunar.solar2lunar(getYear(timeBeijing), getMonth(timeBeijing), getDay(timeBeijing)); // 输入的日子为公历
    str += solar2lunarData.gzYear + "年" + solar2lunarData.monthCn + solar2lunarData.dayCn;
    if (solar2lunarData.term != undefined && solar2lunarData.term.localeCompare('') != 0) {
        str += "\n今天是" + solar2lunarData.term;
    }
    str += "]\n";
    //console.log(str);
    return str;
}
//fetch('https://covidresponse.wisc.edu/dashboard/')
//  .then(res => res.text())
//.then(json => console.log(json));
async function getSchoolData() {

    const browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('https://covidresponse.wisc.edu/dashboard/', { waitUntil: 'load', timeout: 600000 });
    let allData = await page.evaluate(() => {
        return document.getElementsByClassName("cases-cumulative")[0].innerHTML;
    });

    console.log(allData);

    let neareastDay = await page.evaluate(() => {
        return document.getElementById("DataTables_Table_0").innerHTML;
    });
    console.log(neareastDay);
    //Use HTML parser to parse
    browser.close();

    return "";
}

async function main() {
    await getSchoolData();
    //etTime();
}

main();
