# Feeder

A Google Apps Script (GAS) to send translated RSS feeds to Slack.

# Usage

0. Install and setup [clasp](https://github.com/google/clasp) and npm and Slack webhook.

1. Clone this.

```
git clone https://github.com/takubokudori/Feeder
```

2. Create `config.ts` and write a configuration.

```
cd Feeder
yarn install --dev
vi src/config.ts
```

* An example to config.ts

```
import {GlobalFeedConfig} from "./configuration";

const CONFIG = {
    slack_urls: [
        "https://hooks.slack.com/services/Y0ur/w5bHO0k/URL",
    ],
    target_lang: "ja",
    translate_title: true,
    feeds: [
        {feed_url: "http://example.com/rss", source_lang: "ja", target_lang: "en"},
        "http://example.com/atom.xml",
        "http://example.com/index.rdf",
    ],
};
```

Edit `parameters`.

- slack_urls : Slack webhook URLs.
- source_lang : Source language. `"en"` by default.
- target_lang : Target language. No translation by default.
- translate_title : If this is true, titles will be translated. `false` by default.
- feeds : RSS feed URLs.
    - feeds can specify a URL string, or a config object.
    - Each feed can have its own configurations, which can override the global configurations.

3. Upload to GAS.

```
clasp create Feeder
# Create "sheets" script.
clasp push
```

4. Grant the app. (First, execute `dryRun` to initialize the acquired ID list.)

5. Set a trigger.

![trigger](https://user-images.githubusercontent.com/16149911/113476401-4951fa00-94b6-11eb-8548-126c409b0425.PNG)

# LICENSE

See ./LICENSE
