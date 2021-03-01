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

var US_infection_case;
var Dane_infection_case;
var US_infection_vaccine;
var Dane_infection_vaccine;

var toAppend = {};
var history = {
    CDC_Cases:
        [{
            abbr: 'CA',
            tot_cases: 3470877,
            tot_cases_last_24_hours: 0,
            conf_cases: 0,
            prob_cases: 0,
            new_cases07: 35691,
            new_deaths07: 2996,
            Seven_day_avg_new_cases_per_100k: 12.9,
            Seven_day_avg_new_deaths_per_100k: 1.1,
            tot_death: 51821,
            tot_death_last_24_hours: 0,
            conf_death: null,
            prob_death: null,
            death_100k: 131,
            incidence: 8784,
            id: 6,
            fips: '06',
            name: 'California'
        },
        {
            abbr: 'WA',
            tot_cases: 339773,
            tot_cases_last_24_hours: 0,
            conf_cases: 0,
            prob_cases: 0,
            new_cases07: 5979,
            new_deaths07: 134,
            Seven_day_avg_new_cases_per_100k: 11.2,
            Seven_day_avg_new_deaths_per_100k: 0.3,
            tot_death: 4956,
            tot_death_last_24_hours: 0,
            conf_death: null,
            prob_death: null,
            death_100k: 65,
            incidence: 4462,
            id: 53,
            fips: '53',
            name: 'Washington'
        },
        {
            abbr: 'WI',
            tot_cases: 616886,
            tot_cases_last_24_hours: 0,
            conf_cases: 563496,
            prob_cases: 53390,
            new_cases07: 5097,
            new_deaths07: 143,
            Seven_day_avg_new_cases_per_100k: 12.5,
            Seven_day_avg_new_deaths_per_100k: 0.4,
            tot_death: 7014,
            tot_death_last_24_hours: 0,
            conf_death: 6412,
            prob_death: 602,
            death_100k: 120,
            incidence: 10595,
            id: 55,
            fips: '55',
            name: 'Wisconsin'
        },
        {
            abbr: 'USA',
            tot_cases: 28355420,
            tot_cases_last_24_hours: 69876,
            conf_cases: 13029324,
            prob_cases: 1861503,
            new_cases07: 470232,
            new_deaths07: 14542,
            Seven_day_avg_new_cases_per_100k: 20.2,
            Seven_day_avg_new_deaths_per_100k: 0.6,
            tot_death: 510777,
            tot_death_last_24_hours: 1828,
            conf_death: 253499,
            prob_death: 32776,
            death_100k: 153,
            incidence: 8541,
            id: 0,
            fips: '00',
            name: 'United States of America'
        }],
    Dane_Case: { POSITIVE: 40517, POP: 529843 },
    Dane1101_Case: { POSITIVE: 753, POP: 5126 },
    School_Data:
    {
        student_culmulative: 6372,
        student_culmulative_percent: '13.99%',
        employee_culmulative: 750,
        employee_culmulative_percent: '3.90%',
        total_culmulative: 7122,
        date: 'Feb 27',
        Student_today: 19,
        Student_totalTests: 4647,
        Student_test_percent: '0.41%',
        Employee_today: 0,
        Employee_totalTests: 436,
        Employee_test_percent: '0.00%',
        total_Tests: 5083,
        total_Percent: '0.37%'
    },
    CDC_Vaccine:
        [{
            Date: '2021-02-28',
            Location: 'CA',
            ShortName: 'CAA',
            LongName: 'California',
            Census2019: 39512223,
            Doses_Distributed: 11587650,
            Doses_Administered: 8821044,
            Dist_Per_100K: 29327,
            Admin_Per_100K: 22325,
            Administered_Dose1: 6151911,
            Administered_Dose1_Per_100K: 15570,
            Administered_Dose2: 2613260,
            Administered_Dose2_Per_100K: 6614,
            Administered_Dose1_Pop_Pct: 15.5,
            Administered_Dose2_Pop_Pct: 6.6,
            date_type: 'Report',
            Recip_Administered: 8806969,
            Administered_Dose1_Recip: 6141765,
            Administered_Dose2_Recip: 2609341,
            Administered_Dose1_Recip_18Plus: 6138201,
            Administered_Dose2_Recip_18Plus: 2608453,
            Administered_Dose1_Recip_18PlusPop_Pct: 20,
            Administered_Dose2_Recip_18PlusPop_Pct: 8.5,
            Census2019_18PlusPop: 30617582,
            Distributed_Per_100k_18Plus: 37846,
            Administered_18Plus: 8816524,
            Admin_Per_100k_18Plus: 28796
        },
        {
            Date: '2021-02-28',
            Location: 'WA',
            ShortName: 'WAA',
            LongName: 'Washington',
            Census2019: 7614893,
            Doses_Distributed: 2245010,
            Doses_Administered: 1729208,
            Dist_Per_100K: 29482,
            Admin_Per_100K: 22708,
            Administered_Dose1: 1130786,
            Administered_Dose1_Per_100K: 14850,
            Administered_Dose2: 580143,
            Administered_Dose2_Per_100K: 7619,
            Administered_Dose1_Pop_Pct: 14.9,
            Administered_Dose2_Pop_Pct: 7.6,
            date_type: 'Report',
            Recip_Administered: 1735573,
            Administered_Dose1_Recip: 1134837,
            Administered_Dose2_Recip: 582467,
            Administered_Dose1_Recip_18Plus: 1134181,
            Administered_Dose2_Recip_18Plus: 582190,
            Administered_Dose1_Recip_18PlusPop_Pct: 19.1,
            Administered_Dose2_Recip_18PlusPop_Pct: 9.8,
            Census2019_18PlusPop: 5951832,
            Distributed_Per_100k_18Plus: 37720,
            Administered_18Plus: 1728272,
            Admin_Per_100k_18Plus: 29038
        },
        {
            Date: '2021-02-28',
            Location: 'WI',
            ShortName: 'WIA',
            LongName: 'Wisconsin',
            Census2019: 5822434,
            Doses_Distributed: 1588665,
            Doses_Administered: 1470570,
            Dist_Per_100K: 27285,
            Admin_Per_100K: 25257,
            Administered_Dose1: 956474,
            Administered_Dose1_Per_100K: 16427,
            Administered_Dose2: 498381,
            Administered_Dose2_Per_100K: 8560,
            Administered_Dose1_Pop_Pct: 16.5,
            Administered_Dose2_Pop_Pct: 8.6,
            date_type: 'Report',
            Recip_Administered: 1474559,
            Administered_Dose1_Recip: 958333,
            Administered_Dose2_Recip: 500342,
            Administered_Dose1_Recip_18Plus: 957911,
            Administered_Dose2_Recip_18Plus: 500147,
            Administered_Dose1_Recip_18PlusPop_Pct: 21,
            Administered_Dose2_Recip_18PlusPop_Pct: 11,
            Census2019_18PlusPop: 4555837,
            Distributed_Per_100k_18Plus: 34871,
            Administered_18Plus: 1469958,
            Admin_Per_100k_18Plus: 32265
        },
        {
            Date: '2021-02-28',
            Location: 'US',
            ShortName: 'USA',
            LongName: 'United States',
            Census2019: 331996199,
            Doses_Distributed: 96402490,
            Doses_Administered: 75236003,
            Administered_Dose1: 49772180,
            Administered_Dose2: 24779920,
            Administered_Moderna: 36694414,
            Administered_Pfizer: 38426567,
            Administered_Unk_Manuf: 115022,
            Administered_Dose1_Pop_Pct: 15,
            Administered_Dose2_Pop_Pct: 7.5,
            date_type: 'Report',
            Recip_Administered: 75236003,
            Administered_Dose1_Recip: 49772180,
            Administered_Dose2_Recip: 24779920,
            Administered_Dose1_Recip_18Plus: 49728890,
            Administered_Dose2_Recip_18Plus: 24764251,
            Administered_Dose1_Recip_18PlusPop_Pct: 19.5,
            Administered_Dose2_Recip_18PlusPop_Pct: 9.7,
            Census2019_18PlusPop: 255200373,
            Distributed_Per_100k_18Plus: 37775,
            Administered_18Plus: 75176640,
            Admin_Per_100k_18Plus: 29458
        }],
    Dane_Vaccine:
    {
        vaccine1: 98477,
        vaccine1_percent: 18.0,
        vaccine2: 61937,
        vaccine2_percent: 11.3
    },
    Sta:
    {
        cumulative_R: 0.9029177581059421,
        cumulative_level: 2.0377358490566038,
        Dane_R: 1.00210297646,
        Risk_level: 2
    }
};

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


function bigNumberTransform(value) {
    const newValue = ['', '', '']
    let fr = 1000
    let num = 3
    let text1 = ''
    let fm = 1
    while (value / fr >= 1) {
        fr *= 10
        num += 1
        // console.log('数字', value / fr, 'num:', num)
    }
    if (num <= 4) { // 千
        newValue[0] = parseInt(value / 1000) + ''
        newValue[1] = '千'
    } else if (num <= 8) { // 万
        text1 = parseInt(num - 4) / 3 > 1 ? '千万' : '万'
        // tslint:disable-next-line:no-shadowed-variable
        fm = text1 === '万' ? 10000 : 10000000
        if (value % fm === 0) {
            newValue[0] = parseInt(value / fm) + ''
        } else {
            newValue[0] = parseFloat(value / fm).toFixed(2) + ''
        }
        newValue[1] = text1
    } else if (num <= 16) { // 亿
        text1 = (num - 8) / 3 > 1 ? '千亿' : '亿'
        text1 = (num - 8) / 4 > 1 ? '万亿' : text1
        text1 = (num - 8) / 7 > 1 ? '千万亿' : text1
        // tslint:disable-next-line:no-shadowed-variable
        fm = 1
        if (text1 === '亿') {
            fm = 100000000
        } else if (text1 === '千亿') {
            fm = 100000000000
        } else if (text1 === '万亿') {
            fm = 1000000000000
        } else if (text1 === '千万亿') {
            fm = 1000000000000000
        }
        if (value % fm === 0) {
            newValue[0] = parseInt(value / fm) + ''
        } else {
            newValue[0] = parseFloat(value / fm).toFixed(2) + ''
        }
        newValue[1] = text1
    }
    if (value < 1000) {
        newValue[0] = value + ''
        newValue[1] = ''
    }
    return newValue.join('')
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
    let response;
    if (Array.isArray(message)) {
        for (let i of message) {
            response = await fetch("http://wxpusher.zjiecode.com/api/send/message", {
                "headers": {
                    "accept": "*/*",
                    "content-type": "application/json"
                },
                "body": JSON.stringify({
                    "appToken": APP_TOKEN,
                    "content": i,
                    "contentType": 1,//内容类型 1表示文字  2表示html(只发送body标签内部的数据即可，不包括body标签) 3表示markdown 
                    "uids": uids,
                    "url": undefined //原文链接，可选参数
                }),
                "method": "POST"
            });
        }
    }
    response = await fetch("http://wxpusher.zjiecode.com/api/send/message", {
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
        toAppend["School_Data"] = toRe;

        browser.close();
    } catch (e) {
        browser.close();
        core.error("Error happen in getting school data: " + e);
        return null;
    }
    return "截止" + toRe["date"] + "学校总共有" + toRe["total_culmulative"] + "人感染;学生总共有" + toRe["student_culmulative"] + "人感染(占总人数" + toRe["student_culmulative_percent"] + ");教职员工总共有" + toRe["employee_culmulative"] + "人感染(占总人数" + toRe["employee_culmulative_percent"] + ")。在昨日检测中，总共有" + (toRe["Student_today"] + toRe["Employee_today"]) + "人检测阳性(占总测试人数" + toRe["total_Percent"] + "),学生有" + toRe["Student_today"] + "人阳性(占总学生测试人数" + toRe["Student_test_percent"] + ");教职员有" + toRe["Employee_today"] + "人阳性(占总教职员测试人数" + toRe["Employee_test_percent"] + ")\n";
}

async function getVaccineData() {
    let data = await (await fetch("https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_data")).json();
    let toRe = [];

    for (let i of data.vaccination_data) {
        if (i != undefined && i != null) {
            if (i.Location.localeCompare("WI") == 0 || i.Location.localeCompare("US") == 0 || i.Location.localeCompare("CA") == 0 || i.Location.localeCompare("WA") == 0) {
                toRe.push(i);
            }
        }
    }

    toAppend["CDC_Vaccine"] = toRe;

    let str = "➡️疫苗:";

    let WI_his, CA_his, WA_his, US_his;
    for (let i of history.CDC_Vaccine) {
        if (i.Location.localeCompare("US") == 0) {
            US_his = i;
        }
        if (i.Location.localeCompare("WI") == 0) {
            WI_his = i.Recip_Administered;
        }
        if (i.Location.localeCompare("CA") == 0) {
            CA_his = i.Recip_Administered;
        }
        if (i.Location.localeCompare("WA") == 0) {
            WA_his = i.Recip_Administered;
        }
    }

    for (let i of toRe) {
        if (i.Location.localeCompare("US") == 0) {
            US_infection_vaccine = i.Administered_Dose1_Pop_Pct;
            str += "美国总共施打" + bigNumberTransform(i.Recip_Administered) + "针,有" + bigNumberTransform(i.Administered_Dose1_Recip) + "人打完了第一针(占总人数" + i.Administered_Dose1_Pop_Pct + "%),新增" + bigNumberTransform(i.Administered_Dose1_Recip - US_his.Administered_Dose1_Recip) + "人,其中18岁以上有" + bigNumberTransform(i.Administered_Dose1_Recip_18Plus) + "人打完了第一针(占总18+人数" + bigNumberTransform(i.Administered_Dose1_Recip_18PlusPop_Pct) + "%),新增" + bigNumberTransform(i.Administered_Dose1_Recip_18Plus - US_his.Administered_Dose1_Recip_18Plus) + "人.有" + bigNumberTransform(i.Administered_Dose2_Recip) + "人全部打完(占总人数" + i.Administered_Dose2_Pop_Pct + "%),新增" + bigNumberTransform(i.Administered_Dose2_Recip - US_his.Administered_Dose2_Recip) + "人.其中18岁以上有" + bigNumberTransform(i.Administered_Dose2_Recip_18Plus) + "人打完了第一针(占总18+人数" + i.Administered_Dose2_Recip_18PlusPop_Pct + "%),新增" + bigNumberTransform(i.Administered_Dose2_Recip_18Plus - US_his.Administered_Dose2_Recip_18Plus) + "人." + bigNumberTransform(i.Administered_Dose1_Recip - i.Administered_Dose2_Recip) + "人只打了第一针.总共分发了" + bigNumberTransform(i.Doses_Distributed) + "针."
        }
    }
    let strRe = [];
    strRe.push(str);
    str = "";
    //console.log(toRe);
    for (let i of toRe) {
        if (i.Location.localeCompare("WI") == 0) {
            str += "威斯康星州总共施打" + bigNumberTransform(i.Recip_Administered) + "针.新增" + bigNumberTransform(i.Recip_Administered - WI_his) + "针.";
        }
    }
    for (let i of toRe) {
        if (i.Location.localeCompare("WA") == 0) {
            str += "华盛顿州总共施打" + bigNumberTransform(i.Recip_Administered) + "针.新增" + bigNumberTransform(i.Recip_Administered - WA_his) + "针.";
        }
    }
    for (let i of toRe) {
        if (i.Location.localeCompare("CA") == 0) {
            str += "加州总共施打" + bigNumberTransform(i.Recip_Administered) + "针.新增" + bigNumberTransform(i.Recip_Administered - CA_his) + "针."
        }
    }
    str += await getDaneVaccineData();
    strRe.push(str);
    return strRe;
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
        let percentage = [];
        let number = [];
        for (let i of tempList) {
            if (i < 100) percentage.push(i);
            else number.push(i);
        }

        //low, fi
        if (percentage[0] > percentage[1]) {
            let temp = percentage[1];
            percentage[1] = percentage[0];
            percentage[0] = temp;
        }

        if (number[0] > number[1]) {
            let temp = number[1];
            number[1] = number[0];
            number[0] = temp;
        }
        // console.log(response);
        let toRe = {
            "vaccine1": number[1],
            "vaccine1_percent": percentage[1],
            "vaccine2": number[0],
            "vaccine2_percent": percentage[0],
        }

        toAppend["Dane_Vaccine"] = toRe;
        Dane_infection_vaccine = toRe["vaccine1_percent"];
        return "\n戴恩县总共有" + bigNumberTransform(toRe["vaccine1"]) + "人打完了第一针(占总人数" + toRe["vaccine1_percent"] + "%),新增" + bigNumberTransform(toRe["vaccine1"] - history.Dane_Vaccine.vaccine1) + "人." + bigNumberTransform(toRe["vaccine2"]) + "人全部打完(占总人数" + toRe["vaccine2_percent"] + "%),新增" + bigNumberTransform(toRe["vaccine2"] - history.Dane_Vaccine.vaccine2) + "人." + bigNumberTransform(toRe["vaccine1"] - toRe["vaccine2"]) + "人只打了第一针";
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
    toAppend["Dane1101_Case"] = {
        "POSITIVE": data.POSITIVE,
        "POP": data.POP
    };
    return "第1101区阳性病例数" + data.POSITIVE + "(占总人口" + ((data.POSITIVE / data.POP) * 100).toFixed(2) + "%),较昨日新增" + (data.POSITIVE - history.Dane1101_Case.POSITIVE) + "例"
}

async function getDaneCaseData() {
    let data = await (await fetch("https://dhsgis.wi.gov/server/rest/services/DHS_COVID19/COVID19_WI/MapServer/1/query?where=NAME%3D%27Dane%27&outFields=OBJECTID,NAME,DATE,POSITIVE,POS_NEW,POP,POP_MOE&outSR=4326&f=json")).json();
    data = data.features[0].attributes;
    // console.log(data);
    toAppend["Dane_Case"] = {
        "POSITIVE": data.POSITIVE,
        "POP": data.POP
    };
    Dane_infection_case = (data.POSITIVE / data.POP) * 100;
    return "戴恩县阳性病例数" + bigNumberTransform(data.POSITIVE) + "(占总人口" + (Dane_infection_case).toFixed(2) + "%),较昨日新增" + data.POS_NEW + "人."
}


async function getCasesData() {
    let pop2019 = 331996199;
    let pop2019WI = 5822434;
    let response = await (await fetch("https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=US_MAP_DATA")).json();
    let toRe = [];
    for (let i of response.US_MAP_DATA) {
        if (i != undefined && i != null) {
            if (i.abbr.localeCompare("WI") == 0 || i.abbr.localeCompare("USA") == 0 || i.abbr.localeCompare("CA") == 0 || i.abbr.localeCompare("WA") == 0) {
                toRe.push(i);
            }
        }
    }

    toAppend["CDC_Cases"] = toRe;

    let str = "";
    for (let i of toRe) {
        if (i.abbr.localeCompare("USA") == 0) {
            US_infection_case = (i.tot_cases / pop2019) * 100;
            str += "美国总感染人数" + bigNumberTransform(i.tot_cases) + "(占总人数" + (US_infection_case).toFixed(2) + "%).较昨日新增" + bigNumberTransform(i.tot_cases_last_24_hours) + "人.";
        }

    }
    for (let i of toRe) {
        if (i.abbr.localeCompare("WI") == 0) {
            str += "威斯康星州总感染人数" + bigNumberTransform(i.tot_cases) + "(占总人数" + ((i.tot_cases / pop2019WI) * 100).toFixed(2) + "%)."
        }
    }

    str += await getDaneCaseData();
    str += await getDane1101CaseData();
    return str;
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

    toAppend["Sta"] = {
        "cumulative_R": cumulative_R,
        "cumulative_level": cumulative_level,
        "Dane_R": Dane_R,
        "Risk_level": Risk_level
    }

    let R_result, level_result;
    if (Math.abs(cumulative_R - Dane_R) < 0.01) R_result = "和简单平均持平"; else if (cumulative_R < Dane_R) R_result = "高于简单平均"; else R_result = "低于简单平均";
    if (Math.abs(cumulative_level - Risk_level) < 0.01) level_result = "和其他地方一样危险"; else if (cumulative_level < Risk_level) level_result = "比其他地方危险"; else level_result = "比其他地方安全";

    return "戴恩县每一个阳性感染" + Dane_R.toFixed(3) + "人(" + R_result + "),第" + Risk_level + "级危险(" + level_result + ");全国简单平均R值:" + cumulative_R.toFixed(3) + ",简单平均危险级别:" + cumulative_level.toFixed(1) + "\n";

}//

async function getConclusion() {
    let str = "综合免疫率:";
    str += "国家综合免疫率:" + (US_infection_case * 4.6 + US_infection_vaccine * 0.9).toFixed(2) + "%";
    str += "戴恩县综合免疫率:" + (Dane_infection_case * 4.6 + Dane_infection_vaccine * 0.9).toFixed(2) + "%";
    return str;
}

async function loadKVData() {
    let response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ID + "/storage/kv/namespaces/" + KV_ID + "/values/data", {
        headers: {
            "X-Auth-Email": CLOUDFLARE_EMAIL,
            "X-Auth-Key": CLOUDFLARE_API
        }
    })
    history = JSON.parse(await response.text());
}

async function writeToKV(message) {
    let response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ID + "/storage/kv/namespaces/" + KV_ID + "/values/data?", {
        body: message,
        headers: {
            "Content-Type": "text/plain",
            "X-Auth-Email": CLOUDFLARE_EMAIL,
            "X-Auth-Key": CLOUDFLARE_API
        },
        method: "PUT"
    })
    return await response.json();
}

async function main() {
    //await loadUID();
    //let schoolData = await getSchoolData();

    // core part start 
    let toSend = [];
    toSend.push(getTime() + "➡️感染:" + await getCasesData());
    toSend.push(await getSchoolData());
    toSend = toSend.concat(await getVaccineData());
    toSend.push("➡️综合:" + await getRData() + await getConclusion());
    console.log(toSend);
    console.log(await sendMessage(toSend))
    console.log(toAppend);
    // core part end

    // console.log(await getDaneVaccineData());
    // console.log(sendMessage(toSend));
    // console.log(toAppend);
    // var d = new Date();
    // d.setDate(d.getDate() - 1);
    // let dateStr = d.toLocaleDateString("en");
    // let newElement = {};
    // newElement[dateStr] = toAppend;
    // console.log(await writeToKV(JSON.stringify(newElement)));

    // await loadKVData();
    // console.log(history);
    //await sendErrorMessage(message);
    //getTime();
    // console.log(await getCasesData());
    // console.log(await getDane1101CaseData());
    // console.log(await getDaneCaseData());
}

main();