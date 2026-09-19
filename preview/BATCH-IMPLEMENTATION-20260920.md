# Eight-game batch — implementation checkpoint

Production baseline remains 7a61823 (nine titled covers); no game release yet.
Richman is out of scope and unchanged.

54 new independent raster generations exported to storybook/art-20260920-batch (including the corrected transparent memory orb).
Manifest records prompt and source per image. Every generation is one asset, no sheet cropping.
Additional prior independent assets in art-20260914 and art-20260920 are required dependencies.

Implemented: dream chapter/special/cascade rules (106 unit assertions); bubble six goals/stages, bank shot preview, rescue/drop feedback; tower three maps/four classes/branches/support/simulation pause; whack warning/hammer/two modes; jade merge physics feedback and resume; ten integrated flight pilots; sixteen runner poses; eight individual mines numerals.

Browser checked on 390×844 and 844×390: all eight entry/start views; merge drop/resume; tower select/deploy/start/pause; dream valid swap; bubble shot and wrong-orientation gate; whack hit; mines first safe reveal; flappy first-tap/failure; dino failure/retry.
Found/fixed during QA: bubble result target; merge inherited two-column grid; tower letterboxed pointer coordinate; whack grid overflow/gear overlap; mines low contrast; dino absolute HUD positioning; bubble score/skill overlap; collect-stage minimum available red bubbles.

Release candidate: 20260920-release2.

Final verification:
- Dream: 106 rule assertions; browser played 18 valid moves, created line specials, used charged skill, won 22,600 points with 8 moves, advanced to chapter 2.
- Bubble: browser fired all 32 shots, verified matches and detached drops, reached failure result at 7,680, restarted; rotation blocks play.
- Tower: browser deployed and upgraded guardians, used 2× speed, completed all 8 waves, defeated 112 enemies, won with 20 castle life; pause verified.
- Whack: successful hit increases score, complete timed round reaches statistics, retry and pause checked. Warning animation now retains horizontal anchor.
- Merge: 12 drops generated 160 points and tier 5; reload/continue restored score and physics layout. Original memory orb had baked checkerboard; independently edited with imagegen, true alpha confirmed, browser screenshot verifies no rectangular background.
- Flappy: first-tap start, integrated character/plane image, collision result and immediate retry checked; responsive canvas fills remaining play area.
- Dino: independent run poses visible, ground aligned, collision result/retry/pause checked; adaptive canvas eliminates inset scene. All 16 pose files load.
- Mines: 9×9 logic board solved through visible clues (31 UI actions, 71/71 safe cells); same-board practice replay, explosion and loss results verified.
- No runtime errors reported by the fresh final browser session during these checks. Eight game scripts and shared scripts parse; 33 static HTML/CSS files resolve all references; 54 new assets exist.
- Browser emulation tested at 390×844 portrait and 844×390 landscape. This is not a claim of physical iOS/Android device testing or exhaustive balance testing of every chapter.

Original generated PNGs stay in local art directories. Production uses whole-image WebP exports, not sprite-sheet slices. The retired opaque art-20260914/merge-ball-4 image is not referenced or included in this release; its replacement is art-20260920-batch/merge-ball-memory.webp. Dynamic labels, scores and instructions remain live readable text; raster images supply decorative art and board symbols.

Deployment pending commit/push and remote verification.
