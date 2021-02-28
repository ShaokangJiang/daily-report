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

const { APP_TOKEN: APP_TOKEN, CLOUDFLARE_EMAIL: CLOUDFLARE_EMAIL, CLOUDFLARE_API: CLOUDFLARE_API, CLOUDFLARE_ID: CLOUDFLARE_ID, KV_ID: KV_ID, UID_ERR: UID_ERR } = process.env;

if (APP_TOKEN.localeCompare("") == 0 || CLOUDFLARE_EMAIL.localeCompare("") == 0 || CLOUDFLARE_API.localeCompare("") == 0 || CLOUDFLARE_ID.localeCompare("") == 0 || KV_ID.localeCompare("") == 0) {
    core.setFailed(`Action failed because of empty required secrets.`);
}
var UID;
// GET accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier/values/:key_name
async function loadUID() {
    let response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ID + "/storage/kv/namespaces/" + KV_ID + "/values/list", {
        headers: {
            "X-Auth-Email": CLOUDFLARE_EMAIL,
            "X-Auth-Key": CLOUDFLARE_API
        }
    })
    UID = await response.text();
    //core.info(UID);
}

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

//testing function
async function sendErrorMessage(message) {
    if (UID_ERR == undefined || UID_ERR == null) {
        return;
    }
    let uids = [];
    for (let i of UID_ERR.split(";")) {
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
    let str = "[美中时间" + getYear(timeCST) + "年" + getMonth(timeCST) + "月" + getDay(timeCST) + "日";
    str += "\n北京时间" + getYear(timeBeijing) + "年" + getMonth(timeBeijing) + "月" + getDay(timeBeijing) + "日\n";
    const solar2lunarData = solarLunar.solar2lunar(getYear(timeBeijing), getMonth(timeBeijing), getDay(timeBeijing)); // 输入的日子为公历
    str += solar2lunarData.gzYear + "年" + solar2lunarData.monthCn + solar2lunarData.dayCn;
    if (solar2lunarData.term != undefined && solar2lunarData.term.localeCompare('') != 0) {
        str += "\n今天是" + solar2lunarData.term;
    }
    str += "]\n";
    //console.log(str);
    return str;
}

async function getSchoolData() { //finished testing.// TODO: Write to local content and push in the future

    let toRe = {};
    let Students = 45540;
    let Employees = 19225;
    let browser;
    try {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto('https://covidresponse.wisc.edu/dashboard/', { waitUntil: 'load', timeout: 600000 });
        let allData = await page.evaluate(() => {
            return document.getElementsByClassName("cases-cumulative")[0].innerHTML;
        });

        //console.log(allData);
        let cumulative = HTMLParser.parse(allData);
        let nodes = cumulative.querySelectorAll("dd");

        toRe["student_culmulative"] = parseInt(nodes[0].childNodes[0].rawText);
        toRe["student_culmulative_percent"] = ((parseInt(nodes[0].childNodes[0].rawText) / Students) * 100).toFixed(2) + "%";
        toRe["employee_culmulative"] = parseInt(nodes[1].childNodes[0].rawText);
        toRe["employee_culmulative_percent"] = ((parseInt(nodes[1].childNodes[0].rawText) / Employees) * 100).toFixed(2) + "%";
        toRe["total_culmulative"] = parseInt(nodes[2].childNodes[0].rawText);

        let neareastDay = await page.evaluate(() => {
            return document.getElementById("DataTables_Table_0").innerHTML;
        });
        let table = HTMLParser.parse(neareastDay);
        let tr1 = table.querySelectorAll("tbody")[0].childNodes[0];
        let rowContent = tr1.structuredText.split("\n");
        toRe["date"] = rowContent[0];
        toRe["Student_today"] = parseInt(rowContent[1].split("(")[0]);
        toRe["Student_totalTests"] = parseInt(replaceAll(rowContent[2], ",", ""));
        toRe["Student_test_percent"] = ((toRe["Student_today"] / toRe["Student_totalTests"]) * 100).toFixed(2) + "%";
        toRe["Employee_today"] = parseInt(rowContent[3].split("(")[0]);
        toRe["Employee_totalTests"] = parseInt(replaceAll(rowContent[4], ",", ""));
        toRe["Employee_test_percent"] = ((toRe["Employee_today"] / toRe["Employee_totalTests"]) * 100).toFixed(2) + "%";
        toRe["total_Tests"] = toRe["Student_totalTests"] + toRe["Employee_totalTests"];
        toRe["total_Percent"] = (((toRe["Student_today"] + toRe["Employee_today"]) / toRe["total_Tests"])*100).toFixed(2) + "%";

        browser.close();
    } catch (e) {
        browser.close();
        core.error("Error happen in getting school data: " + e);
        return null;
    }
    return toRe;
}

async function getCDCVaccineData(){
    let data = await (await fetch("https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data")).json();
    let toRe = [];

    for(let i of data.vaccination_data){
        if(i.Location.localeCompare("WI") == 0 || i.Location.localeCompare("US") == 0 || i.Location.localeCompare("CA") == 0 || i.Location.localeCompare("WA") == 0 ){
            toRe.push(i);
        }
    }

    return toRe;

}

async function getDaneVaccineData(){
    
}

async function getDaneCaseData(){
    
}

async function getCDCExpectationData(){
    //put it to weekly update instead of this daily update
    //Use fetch from https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=forecasting_region_US_data
}

async function getRData(){
    
}

async function main() {
    //await loadUID();
    //let schoolData = await getSchoolData();
    let CDCvaccine = await getCDCVaccineData();
    console.log(CDCvaccine);
    //await sendErrorMessage(message);
    //getTime();
}

main();
