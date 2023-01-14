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
export interface Feed {
    feed_url: string;
    slack_urls?: (number | string)[];
    source_lang?: string;
    target_lang?: string;
    translate_title?: boolean;
}

export interface GlobalFeedConfig {
    slack_urls: string[];
    abort?: string;
    source_lang?: string;
    target_lang?: string;
    translate_title?: boolean;
    feeds: (string | Feed)[];
}

export interface FeedInfo {
    feed_url: string;
    slack_urls: Set<string>;
    source_lang: string;
    target_lang: string;
    translate_title: boolean;
}

export function feedConfigToFeedInfo(gfc: GlobalFeedConfig, i: number): FeedInfo {
    const globalSlackUrls = gfc.slack_urls ?? [];
    const globalSourceLang = gfc.source_lang ?? "en";
    const globalTargetLang = gfc.target_lang ?? "";
    const globalTranslateTitle = gfc.translate_title ?? false;

    const feed = gfc.feeds[i];
    let feed_url: string;
    let slack_urls: string[] = globalSlackUrls;
    let source_lang: string;
    let target_lang: string;
    let translate_title: boolean;
    let ignore_updated: boolean;
    if (implementsFeed(feed)) {
        feed_url = feed.feed_url;
        if (typeof feed.slack_urls !== "undefined") {
            slack_urls = getSlackUrls(globalSlackUrls, feed);
        }
        source_lang = feed.source_lang ?? globalSourceLang;
        target_lang = feed.target_lang ?? globalTargetLang;
        translate_title = feed.translate_title ?? globalTranslateTitle;
    } else {
        feed_url = feed;
        source_lang = globalSourceLang;
        target_lang = globalTargetLang;
        translate_title = globalTranslateTitle;
    }
    feed_url = feed_url.trim();

    return {
        feed_url,
        slack_urls: new Set<string>(slack_urls),
        source_lang,
        target_lang,
        translate_title
    }
}


export function getSlackUrls(globalSlackUrls: string[], feed: Feed): string[] {
    const ret = [];
    if (typeof feed.slack_urls === "undefined") {
        return globalSlackUrls;
    } else {
        if (feed.slack_urls.length === 0) return globalSlackUrls;
        for (const slackUrl of feed.slack_urls) {
            if (typeof slackUrl === "number") {
                ret.push(globalSlackUrls[slackUrl]);
            } else {
                const x = slackUrl.trim();
                if (x.startsWith("https://hooks.slack.com/services/")) {
                    ret.push(x);
                }
            }
        }
    }
    return ret;
}

export function implementsFeed(x: any): x is Feed {
    return x !== null &&
        typeof x.feed_url === "string";
}
