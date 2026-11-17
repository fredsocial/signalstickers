<a href="https://signalstickers.com" id="top">
  <img src="https://user-images.githubusercontent.com/441546/87215225-358fb380-c2e9-11ea-8c77-02aad9ed3a5a.png" style="max-width: 100%;" />
</a>

<p align="center">
  <a href="https://github.com/signalstickers/signalstickers/actions?query=workflow%3A%22Continuous+Integration%22"><img src="https://img.shields.io/github/workflow/status/signalstickers/signalstickers/Continuous%20Integration/master"></a>
  <a href="https://github.com/signalstickers/signalstickers/graphs/contributors"><img src="https://img.shields.io/github/contributors/signalstickers/signalstickers"></a>
  <a href="README.de.md"><img src="http://bit.ly/3bljOI0" alt="Deutsch"></a>
  <a href="README.fr.md"><img src="https://bit.ly/31xkO7h" alt="Français"></a>
  <a href="https://twitter.com/signalstickers"><img src="https://img.shields.io/twitter/follow/signalstickers?label=Feed&style=social"></a>
</p>

## About
A nice and handy gallery to browse and download sticker packs for Signal.
This site is served on [signalstickers.com](https://signalstickers.com),
directly from this GitHub repository.

## Adding a sticker pack to this site
Use the tool [Contribute](https://signalstickers.com/contribute) at the top of
`signalstickers.com`, and follow the guide!

> Note: adding a sticker pack requires [a Github account](https://github.com/join).
> It's free!

Alternatively, you can send us the results of the
[Contribute](https://signalstickers.com/contribute) page via a Twitter private
message at [@signalstickers](https://twitter.com/signalstickers). Please only
use this if you have no way to open a PR on Github!

### Contribution guidelines
We reserve the right to moderate and refuse packs or stickers. In particular:
+ Stickers packs that call for hatred or violence against people or communities
  based on age, body size, disability, ethnicity, gender identity and
  expression, nationality, personal appearance, race, religion, or sexual
  identity and orientation;
+ Sticker packs that directly promote a brand or a company.

We also reserve the right to moderate packs or stickers after their submission
and acceptance.

The idea is to keep a family atmosphere: I'd like my grandmother to be able to
navigate sticker packs quietly.

## Q&A

### How can I create a sticker pack?
Follow the tutorial on the [Signal support site](https://support.signal.org/hc/articles/360031836512-Stickers#h_c2a0a45b-862f-4d12-9ab1-d9a6844062ca)
to upload your stickers to Signal.

> Note: when creating stickers, don't forget to add a white stroke to improve
> legibility on dark themes! You can use [this script](https://github.com/signalstickers/stickers-scripts/blob/master/add_border.sh)
> or use [this project](https://framagit.org/luc/stickerify-for-signal)
> to automatically resize and add a white stroke on all the PNG and WEBP images
> of a directory.

### How can I create animated stickers?
You can use our lib to create animated stickers from GIF/APNG. You can also use
the Signal Desktop app to create animated stickers from APNG files.

You can also use [some tools we provide to assist you with animated stickers creation](https://github.com/signalstickers/stickers-scripts).

> Note that support for some APNG files is [not perfect on Signal for iOS at the moment.](https://github.com/signalapp/Signal-iOS/issues/4611)

### Am I required to add my sticker pack to this site to share it with my friends?
**No**. You can just send any sticker to your friends and they will be able to
install the pack, or you can share your sticker pack using the `signal.art` link
that you got when you created your sticker pack, or by using the share button
from inside the signal app's sticker managment screen.

Do not hesitate to post your pack on social networks using the hashtag
`#makeprivacystick` as well!

### Can you create a sticker pack for me?
Ask on [Discussions](https://github.com/signalstickers/signalstickers/discussions), and a fellow user might help you!

### Where can I find more stickers?
- Head to the [Sticker pack collection
  thread](https://community.signalusers.org/t/sticker-pack-collection-thread-makeprivacystick/10650)
  on the [Signal Community forum](https://community.signalusers.org);
- Search Twitter for the
  [`#makeprivacystick`](https://twitter.com/hashtag/makeprivacystick) hashtag.

### Is this a commercial project?
**No**. This project is and will remain open-source.


### Who built this?
[@romainricard](https://github.com/romainricard),
[@darkobits](https://github.com/darkobits),
[@valkheim](https://github.com/valkheim),
[@muellermartin](https://github.com/muellermartin),
[@sticker201](https://github.com/sticker201) and
[@u32i64](https://github.com/u32i64) participated to the conception and the
code.

The stickers were added [by the community](https://github.com/signalstickers/signalstickers/graphs/contributors).
Most of stickers from Telegram were ported by [@signal-stickers](https://github.com/signal-stickers).

## Developing this fork

Use Node.js 22.12 or newer. The unpublished `@darkobits/ts-unified`
wrapper has been replaced by explicit Babel, TypeScript, ESLint, Jest and NPS
configuration. React 16, Linaria 2, Signal links and the catalog format remain.
Local lint configuration retains the former type-aware rules, mapping removed
names and options to their current equivalents. Linaria uses its supported
extractor because the old shaker drops exports emitted by modern Babel. A
local Modernizr loader replaces Webpack's removed `loader.exec` API.

```sh
npm ci --ignore-scripts
npm test
npm run build:fixture
npm start
```

The fixture build compiles the production gallery using two synthetic cached
manifests, blocks network requests, and checks catalog order and home-chunk
preloads. Every emitted script must also parse as ES2019. The security-fixed
query-string decoder is transpiled for Safari/iOS 13 to preserve the older
browser path. The build writes **`dist-fixture/`**, which must never be published. Tests
exercise authenticated manifest/image decryption in browser and Node clients,
reject modified MACs and malformed protobuf, and check search/filter queries.
For local browser checks, `node config/serve-fixture.cjs` serves that output on
`http://127.0.0.1:8088`, redirecting Signal requests and analytics to local test
responses. The normal development server uses `127.0.0.1:8080` with host checks.

`npm run build` builds the real `stickers.yml` catalog into **`dist/`**, using
`.sticker-pack-cache/` and fetching missing public manifests from Signal.
CI runs tests and the offline build on every push and pull request. This fork
currently has no configured Pages site or deployment key, so its existing
upstream publishing job is gated by `ENABLE_PAGES_DEPLOY=true`. It only accepts
a real `dist/` build; validation cannot upload or publish fixtures. The publisher requires a configured Pages site and
`GH_PAGES_DEPLOY_KEY` before enabling it. Both artifact actions use version 4,
and only the downloaded production build is passed to the publisher. No public website is created by validation.

Keep the previous source revision and lockfile for rollback. Restore those
files, reinstall with `npm ci --ignore-scripts`, and rebuild the real catalog
before republishing. Do not clear the public-manifest cache unintentionally.

## License
See [LICENSE.md](LICENSE.md).
