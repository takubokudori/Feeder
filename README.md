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
npm install
vi src/config.ts
```

* An example to config.ts

```
const CONFIG = {
    slack_urls: [
        "https://hooks.slack.com/services/Y0ur/w5bHO0k/URL",
    ],
    feed_urls: [
        "http://example.com/rss",
        "http://example.com/atom.xml",
        "http://example.com/index.rdf",
    ],
    target_lang: "ja",
};
```

Edit `slack_urls`, `feed_urls`, `target_lang`.

- slack_urls : Slack webhook URLs.
- feed_urls : Feed URLs.
- target_lang : Language to be translated.

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
