# Image delivery release: 20260924-speed2

## Scope

Delivery-only changes; no new artwork, cropping, gameplay or character-name changes. Original PNG files retained. Recompressed WebP originals remain available in Git and in the adjacent `asset-originals-speed24` backup directory.

792 optimized delivery files: 385,703,095 bytes before, 84,930,262 bytes after (78.0% reduction for this selected file set, not a claim about every page or loading time). Dimensions and alpha checked for every output. This set includes dormant assets.

## Browser observations

Local Chromium startup image encoded-body totals, rounded KiB:

| Game | Before | After |
| --- | ---: | ---: |
| 2048 | 11276 | 982 |
| Brick breaker | 22503 | 4417 |
| Click core | 9725 | 1011 |
| Link | 3793 | 532 |
| Memory | 6200 | 1173 |
| Tetris | 25021 | 4866 |

15 non-Richman pages completed automatic startup checks without broken DOM images or browser page errors. Richman did not reach the audit's network-idle condition; inspected separately with a complete rendered homepage and completed image requests. These localhost figures measure bytes, not real mobile-network seconds; shared-cache and request timing can change counts between runs. No claim of full gameplay verification for all games in this release.

## Loading behavior

- PNG runtime references use independently encoded WebP siblings; original routes remain available.
- Richman: deduplicated Image objects, six-request queue, homepage priority, one retry on failure.
- Richman offline cache no longer prefetches the full artwork/audio package during installation; stores requested images by exact versioned URL.
- Whack and rotation/pause gate use existing small individual character portraits instead of large originals.
- Game script/style and website entry versions bumped to avoid stale code referencing old paths.

## Verification

- `test-image-delivery.cjs`: 792 dimensions/alpha/size checks, modified game JS syntax, all small portrait paths.
- `test-gameplay-repair.cjs`: 19 passes.
- `test-mobile24.cjs`: 8 passes.
- Visual spot checks: Richman homepage; 2048 homepage; Whack mobile homepage and gameplay.
- Tower-defense holding page remains closed.
