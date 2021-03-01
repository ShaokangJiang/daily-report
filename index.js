const solarLunar = require("solarlunar");
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const moment = require('moment-timezone');
const urlencode = require('urlencode');
const cookie = require('cookie');
const HTMLParser = require('node-html-parser');
const core = require('@actions/core');
const { NlpManager } = require('node-nlp');

const dotenv = require("dotenv")

dotenv.config()

const { APP_TOKEN: APP_TOKEN, CLOUDFLARE_EMAIL: CLOUDFLARE_EMAIL, CLOUDFLARE_API: CLOUDFLARE_API, CLOUDFLARE_ID: CLOUDFLARE_ID, KV_ID: KV_ID, UID_ERR: UID_ERR, COVID_ACT_KEY: COVID_ACT_KEY } = process.env;
var { UID: UID } = process.env;

var toAppend = {};

if (APP_TOKEN.localeCompare("") == 0 || CLOUDFLARE_EMAIL.localeCompare("") == 0 || CLOUDFLARE_API.localeCompare("") == 0 || CLOUDFLARE_ID.localeCompare("") == 0 || KV_ID.localeCompare("") == 0 || COVID_ACT_KEY.localeCompare("") == 0) {
    core.setFailed(`Action failed because of empty required secrets.`);
}
// GET accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier/values/:key_name
async function loadUID() {
    if (UID == null || UID == undefined) {
        let response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ID + "/storage/kv/namespaces/" + KV_ID + "/values/list", {
            headers: {
                "X-Auth-Email": CLOUDFLARE_EMAIL,
                "X-Auth-Key": CLOUDFLARE_API
            }
        })
        UID = await response.text();
    }
    //core.info(UID);
    // load yesterday data:

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
        toRe["total_Percent"] = (((toRe["Student_today"] + toRe["Employee_today"]) / toRe["total_Tests"]) * 100).toFixed(2) + "%";

        browser.close();
    } catch (e) {
        browser.close();
        core.error("Error happen in getting school data: " + e);
        return null;
    }
    return "截止" + toRe["date"] + "学校总共有" + toRe["total_culmulative"] + "人感染;学生总共有" + toRe["student_culmulative"] + "人感染(占总人数" + toRe["student_culmulative_percent"] + ");教职员工总共有" + toRe["employee_culmulative"] + "人感染(占总人数" + toRe["employee_culmulative_percent"] + ")。在昨日检测中，总共有" + (toRe["Student_today"] + toRe["Employee_today"]) + "人检测阳性(占总测试人数" + toRe["total_Percent"] + "),学生有" + toRe["Student_today"] + "人阳性(占总学生测试人数" + toRe["Student_test_percent"] + ");教职员有" + toRe["Employee_today"] + "人阳性(占总教职员测试人数" + toRe["Employee_test_percent"] + ")\n";
}

async function getCDCVaccineData() {
    let data = await (await fetch("https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data")).json();
    let toRe = [];

    for (let i of data.vaccination_data) {
        if (i != undefined && i != null) {
            if (i.Location.localeCompare("WI") == 0 || i.Location.localeCompare("US") == 0 || i.Location.localeCompare("CA") == 0 || i.Location.localeCompare("WA") == 0) {
                toRe.push(i);
            }
        }
    }
    return toRe;
}

async function getDaneVaccineData() {

    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto("https://bi.wisconsin.gov/t/DHS/views/VaccinesAdministeredtoWIResidents/VaccinatedWisconsin-County?:isGuestRedirectFromVizportal=y&:embed=y", { waitUntil: "networkidle0", timeout: 200000 });

        // const elem = await page.$("canvas");
        // console.log(JSON.stringify(elem, 2));
        // await clickOnElement(elem, 400);
        await page.mouse.click(732, 625);
        await page.waitForSelector(".tab-tooltipContent", { timeout: 200000 });

        let valueBlock = await page.evaluate(() => {
            return document.getElementsByClassName("tab-tooltipContent")[0].innerHTML;
        });
        let parseContent = HTMLParser.parse(valueBlock);
        // await new Promise(r => setTimeout(r, 200000));


        const manager = new NlpManager({ languages: ['en'], forceNER: true });
        const response = await manager.process('en', parseContent.querySelector(".tab-ubertipTooltip").structuredText.split("\n")[2]);
        let tempList = [];
        for (let i of response.entities) {
            if (i.entity.localeCompare("number") == 0) {
                if (i.resolution.value != 1)
                    tempList.push(i.resolution.value);
            }
        }
        // console.log(response);
        let toRe = {
            "vaccine1": tempList[1],
            "vaccine1_percent": tempList[0],
            "vaccine2": tempList[3],
            "vaccine2_percent": tempList[2],
        }
        return "戴恩县总共有" + toRe["vaccine1"] + "人打完了第一针(占总人数" + toRe["vaccine1_percent"] + "%)," + toRe["vaccine2"] + "人全部打完(占总人数" + toRe["vaccine2_percent"] + "%)";
    } catch (e) {
        throw new Error("new error" + e);
    } finally {
        await browser.close();
    }
}

async function getDane1101CaseData() {
    let data = await (await fetch("https://dhsgis.wi.gov/server/rest/services/DHS_COVID19/COVID19_WI/MapServer/9/query?where=GEOID%3D%2755025001101%27&outFields=GEOID,GEO,NAME,COUNTY,DATE,POSITIVE,POP_MOE,POP&outSR=4326&f=json")).json();
    data = data.features[0].attributes;
    // console.log(data);
    return "第1101区阳性病例数" + data.POSITIVE + "(占总人口" + ((data.POSITIVE / data.POP) * 100).toFixed(2) + "%),较昨日新增\n"
}

async function getDaneCaseData() {
    let data = await (await fetch("https://dhsgis.wi.gov/server/rest/services/DHS_COVID19/COVID19_WI/MapServer/1/query?where=NAME%3D%27Dane%27&outFields=OBJECTID,NAME,DATE,POSITIVE,POS_NEW,POP,POP_MOE&outSR=4326&f=json")).json();
    data = data.features[0].attributes;
    // console.log(data);
    return "戴恩县阳性病例数" + data.POSITIVE + "(占总人口" + ((data.POSITIVE / data.POP) * 100).toFixed(2) + "%),较昨日新增" + data.POS_NEW + "\n"
}

async function getCountryCaseData() {
    let pop2019 = 328239523;
    let response = await (await fetch("https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=US_MAP_DATA")).json();
    let toRe = [];
    for (let i of response.US_MAP_DATA) {
        if (i != undefined && i != null) {
            if (i.abbr.localeCompare("WI") == 0 || i.abbr.localeCompare("USA") == 0 || i.abbr.localeCompare("CA") == 0 || i.abbr.localeCompare("WA") == 0) {
                toRe.push(i);
            }
        }
    }
    return toRe;
}

async function getCDCExpectationData() {
    //put it to weekly update instead of this daily update
    //Use fetch from https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=forecasting_region_US_data
}

async function getRData() {
    let allStates = await (await fetch("https://api.covidactnow.org/v2/states.json?apiKey=" + COVID_ACT_KEY)).json();

    let cumulative_R = 0, cumulative_level = 0;
    let R_count = 0, level_count = 0;
    for (const i of allStates) {
        if (i.metrics.infectionRate != null) {
            cumulative_R += i.metrics.infectionRate;
            R_count++;
        }
        if (i.riskLevels.overall != null) {
            cumulative_level += i.riskLevels.overall;
            level_count++;
        }
    }
    cumulative_R = cumulative_R / R_count;
    cumulative_level = cumulative_level / level_count;
    let WI = await (await fetch("https://api.covidactnow.org/v2/county/WI.json?apiKey=" + COVID_ACT_KEY)).json();
    let Dane_R, Risk_level;
    for (const i of WI) {
        if (i.county.localeCompare("Dane County") == 0) {
            Dane_R = i.metrics.infectionRate;
            Risk_level = i.riskLevels.overall;
            break;
        }
    }

    let R_result, level_result;
    if (Math.abs(cumulative_R - Dane_R) < 0.01) R_result = "和简单平均持平"; else if (cumulative_R < Dane_R) R_result = "高于简单平均"; else R_result = "低于简单平均";
    if (Math.abs(cumulative_level - Risk_level) < 0.01) level_result = "和其他地方一样危险"; else if (cumulative_level < Risk_level) level_result = "比其他地方危险"; else level_result = "比其他地方安全";

    return "戴恩县每一个阳性感染" + Dane_R.toFixed(3) + "人(" + R_result + "),第" + Risk_level + "级危险(" + level_result + ");全国简单平均R值:" + cumulative_R.toFixed(3) + ",简单平均危险级别:" + cumulative_level.toFixed(1) + "\n";

}

async function main() {
    //await loadUID();
    //let schoolData = await getSchoolData();
    let CDCvaccine = await getCDCVaccineData();
    console.log(CDCvaccine);
    console.log(await getCountryCaseData());
    // console.log(await sendMessage(await getRData() + await getSchoolData()));
    //await sendErrorMessage(message);
    //getTime();
    // console.log(await getDaneVaccineData());
    // console.log(await getDane1101CaseData());
    // console.log(await getDaneCaseData());
}

main();