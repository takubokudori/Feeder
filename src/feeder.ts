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
export function fetchFeedUrl(url: string): Feeder {
    const xml = UrlFetchApp.fetch(url).getContentText();
    const document = XmlService.parse(xml);
    const root = document.getRootElement();
    return getFeeder(root);
}

function getFeeder(root): Feeder {
    const tag = root.getName().toLowerCase();
    switch (tag) {
        case 'rdf':
            return new Rdf(root);
        case 'feed':
            return new Feed(root);
        case 'rss':
            return new Rss(root);
        default:
            return undefined;
    }
}

export interface Feeder {
    getEntries();

    getEntries2();

    getTitle(entry): string;

    getLink(entry): string;

    getDescription(entry): string;

    getId(entry): string;
}

export class Feed implements Feeder {
    static nameSpace = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    root;

    constructor(root) {
        this.root = root;
    }

    getEntries() {
        return this.root.getChildren('item', Feed.nameSpace);
    }

    getEntries2() {
        return getEntriesData(this);
    }

    getTitle(entry): string {
        return entry.getChild('title', Feed.nameSpace).getText();
    }

    getId(entry): string {
        return this.getLink(entry);
    }

    getLink(entry): string {
        return entry.getChild('link', Feed.nameSpace).getAttribute('href').getValue();
    }

    getDescription(entry): string {
        return entry.getChild('content', Feed.nameSpace).getText();
    }

}

export class Rss implements Feeder {
    root;

    constructor(root) {
        this.root = root;
    }

    getEntries() {
        return this.root.getChild('channel').getChildren('item');
    }

    getEntries2() {
        return getEntriesData(this);
    }

    getTitle(entry): string {
        return entry.getChild('title').getText();
    }

    getId(entry): string {
        return this.getLink(entry);
    }

    getLink(entry): string {
        return entry.getChild('link').getText();
    }

    getDescription(entry): string {
        return entry.getChild('description').getText();
    }
}

export class Rdf implements Feeder {
    static nameSpace = XmlService.getNamespace('http://purl.org/rss/1.0/');
    root;

    constructor(root) {
        this.root = root;
    }

    getEntries() {
        return this.root.getChildren('item', Rdf.nameSpace);
    }

    getEntries2() {
        return getEntriesData(this);
    }

    getTitle(entry): string {
        return entry.getChild('title', Rdf.nameSpace).getText();
    }

    getId(entry): string {
        return this.getLink(entry);
    }

    getLink(entry): string {
        return entry.getChild('link', Rdf.nameSpace).getText();
    }

    getDescription(entry): string {
        return entry.getChild('description', Rdf.nameSpace).getText();
    }

}

function getEntriesData(feeder) {
    const ret = new Array(0);
    for (const entry of feeder.getEntries()) {
        const title = feeder.getTitle(entry);
        const description = feeder.getDescription(entry);
        const link = feeder.getLink(entry);
        ret.push(
            {
                id: link,
                title,
                link,
                description
            }
        );
    }
    return ret;
}
