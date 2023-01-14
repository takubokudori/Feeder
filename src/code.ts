/*
Copyright 2023 takubokudori
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
import {feedConfigToFeedInfo} from "./configuration";
import {fetchFeedUrl} from "./feeder";

/**
 * run
 * @constructor
 */
function run() {
    execute(false);
}

/**
 * dryRun doesn't send to slack.
 * @constructor
 */
function dryRun() {
    execute(true);
}

function execute(dryRun: boolean) {
    const sheet = IdSheet.getActiveIdSheet();
    const acquiredIDs = sheet.getAcquiredIDs();
    const abortTiming = exports.CONFIG.abort ?? "no";
    switch (abortTiming) {
        case "immediately":
        case "yes":
        case "no":
            break;
        default:
            throw new Error(`Invalid abort parameter: ${abortTiming}`);
    }
    let errorMessage = "";

    for (let i = 0; i < exports.CONFIG.feeds.length; i++) {
        let feed = feedConfigToFeedInfo(exports.CONFIG, i);
        Logger.log(`Check ${feed.feed_url}`);
        let items;
        try {
            items = fetchFeedUrl(feed.feed_url);
            if (items === undefined) {
                const msg = `Feeder doesn't support the feed format: ${feed.feed_url}`
                Logger.log(msg);
                errorMessage += `${msg}\n`;
                continue;
            }
        } catch (e) {
            if (abortTiming === "immediately") throw e;
            const msg = `Failed to get feed ${feed.feed_url}: ${e}`;
            Logger.log(msg);
            errorMessage += `${msg}\n`;
            continue;
        }
        for (const item of items.getEntries2()) {
            if (acquiredIDs.has(item.id)) {
                Logger.log(`[Already] ${item.id}`);
                continue;
            }
            Logger.log(`[  New  ] ${item.id}`);

            let title = item.title;
            let description = formatText(item.description);

            // translates if not dry run mode.
            try {
                if (!dryRun && feed.target_lang !== "" && feed.source_lang !== "" && feed.target_lang !== feed.source_lang) {
                    description = LanguageApp.translate(description, feed.source_lang, feed.target_lang);
                }
                if (!dryRun && feed.translate_title && feed.target_lang !== "" && feed.source_lang !== "" && feed.target_lang !== feed.source_lang) {
                    title = LanguageApp.translate(title, feed.source_lang, feed.target_lang);
                }
            } catch (e) {
                if (abortTiming === "immediately") throw e;
                const msg = `Failed to translate: ${e}`;
                Logger.log(msg);
                errorMessage += `${msg}\n`;
                continue;
            }


            const feedText = `${item.link}
${title}

${description}`;
            Logger.log(feedText);

            let errSlack = false;
            if (!dryRun) {
                feed.slack_urls.forEach(slack_url => {
                    try {
                        postToSlack(slack_url.trim(), feedText);
                    } catch (e) {
                        if (abortTiming === "immediately") throw e;
                        errSlack = true;
                        const msg = `Failed to post to Slack ${slack_url}: ${e}`;
                        Logger.log(msg);
                        errorMessage += `${msg}\n`;
                    }
                });
            }

            if (!errSlack) {
                acquiredIDs.add(item.id);
                sheet.appendId(item.id);
            }
        }
    }
    if (errorMessage.length !== 0) {
        Logger.log(errorMessage);
        if (abortTiming === "yes") throw new Error(errorMessage);
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
            ontext(text) {
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
