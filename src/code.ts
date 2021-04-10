///<reference path="config.ts"/>
///<reference path="feeder.ts"/>
/*
Copyright 2021 takubokudori
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import Integer = GoogleAppsScript.Integer;

/**
 * Run
 * @constructor
 */
function run() {
    execute(false);
}

/**
 * DryRun doesn't send to slack.
 * @constructor
 */
function dryRun() {
    execute(true);
}

function execute(dryRun: boolean) {
    const sheet = IdSheet.getActiveIdSheet();
    const feedUrls = CONFIG.feed_urls;
    const slackUrls = CONFIG.slack_urls;
    const targetLang = CONFIG.target_lang;

    const acquiredIDs = sheet.getAcquiredIDs();
    execute2(sheet, dryRun, feedUrls, slackUrls, targetLang, acquiredIDs);
}

function execute2(sheet, dryRun, feedUrls, slackUrls, targetLang, acquiredIDs) {
    for (let feedUrl of feedUrls) {
        feedUrl = feedUrl.trim();
        Logger.log(`Check ${feedUrl}`);
        const items = fetchFeedUrl(feedUrl);
        if (items === undefined) {
            Logger.log(`Feeder doesn't support the feed format: ${feedUrl}`);
            // continue;
        }
        execute3(sheet, dryRun, items, slackUrls, targetLang, acquiredIDs);
    }
}

function execute3(sheet, dryRun, items, slackUrls, targetLang, acquiredIDs) {
    for (const item of items.getEntries2()) {
        if (acquiredIDs.has(item.id)) {
            Logger.log(`${item.id} is already acquired.`);
            continue;
        }

        Logger.log(`${item.id} is new!`);
        let description = formatText(item.description);

        // translates if not dry run mode.
        if (!dryRun && targetLang !== "" && targetLang !== "en") {
            description = LanguageApp.translate(description, "en", targetLang);
        }

        // append ID.
        acquiredIDs.add(item.id);
        sheet.appendId(item.id);

        const feedText = `${item.link}
${item.title}
${description}`;
        Logger.log(feedText);

        // sends if not dry run mode.
        if (!dryRun) {
            for (const slackUrl of slackUrls) {
                postToSlack(slackUrl.trim(), feedText);
            }
        }
    }
}

class IdSheet {
    sheet: Sheet;

    constructor(sheet: Sheet) {
        this.sheet = sheet;
    }

    static getActiveIdSheet() {
        return new IdSheet(SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
    }

    getRowsAsSet(row: Integer) {
        const lastRow = this.sheet.getLastRow();
        let arr = [];
        if (lastRow > 0) {
            arr = this.sheet.getRange(1, row, lastRow).getValues();
        }
        const l = [].concat(...arr);

        // @ts-ignore
        const ret = new Set<string>(l);
        ret.delete("");
        return ret;
    }

    getAcquiredIDs() {
        return this.getRowsAsSet(1);
    }

    appendId(id: string) {
        this.sheet.appendRow([`'${id}`]);
    }

}

function postToSlack(url: string, text: string) {
    UrlFetchApp.fetch(url,
        {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify({'text': text})
        }
    );
}

function formatText(text: string): string {
    text = convertHtmlToText(text);
    text = text
        .trim()
        .replace(/\r/g, "")
        .replace(/\n/g, " ")
        .replace(/ {2}/g, " ")
        .replace(/\. /g, ".\r\n")
        .replace(/\.\n/g, ".\r\n")
        .replace(/\.\t/g, ".\r\n")
        .replace(/! /g, "!\r\n")
        .replace(/!\n/g, "!\r\n")
        .replace(/!\t/g, "!\r\n")
        .replace(/\? /g, "?\r\n")
        .replace(/\?\n/g, "?\r\n")
        .replace(/\?\t/g, "?\r\n")
        .replace(/Fig\.\r\n/g, "Fig. ")
        .replace(/et al\.\r\n/g, "et al. ")
        .replace(/et al,\.\r\n/g, "et al. ");
    return text;
}

/**
 * Removes unnecessary html tags.
 * @param txt
 */
function convertHtmlToText(txt: string) {
    // @ts-ignore
    const htmlparser = htmlparser2.init();
    let ret = "";
    let isFirst = true;
    const parser = new htmlparser.Parser(
        {
            ontext: function (text) {
                if (!isFirst) ret += " ";
                ret += text;
                isFirst = false;
            }
        }, {decodeEntities: true}
    );
    parser.write(txt);
    parser.end();
    return ret;
}