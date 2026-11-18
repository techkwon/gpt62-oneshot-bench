# AI coding experiment report

This public companion to TechKwon’s lecture starts with a real, playable recording. A viewer can move from a round winner to the individual submissions and ballots that produced the score. The primary contexts are a full-screen lecture and a phone opened from the video description.

## Structure

- The masthead links to results, task evidence, execution costs and methodology. The raw dataset is available in the header.
- The opening pairs the report title with a manually controlled film viewer. Each poster is a frame from its source recording. The frame opens the video, and the player links directly to that task’s evidence.
- Round selectors update the leaderboard, winner and tool conditions together. The table keeps total Borda points, self-vote exclusions, first-place votes and execution totals in separate columns.
- The evidence viewer keeps one selected recording in view. Original prompts, blind sheets, letter keys and judges’ reasons open independently so viewers can inspect a sheet before revealing the models.
- The ledger documents reused runs and the discarded Fable attempts. A separate speed test and paired publisher/lecture findings lead into the method and source downloads.

## Visual and interaction decisions

Warm paper, graphite type, fine rules and cobalt highlights borrow from a printed results report. System sans-serif faces support Korean without a font download. Large headline type and a cropped still introduce the experiment. Playback preserves the original aspect ratio. The winner panel uses both a text label and colour, and every score bar has a numeric value.

On a phone, the masthead wraps into two rows, the film follows the introduction and the evidence controls stack. Wide data tables scroll inside focusable regions. The leaderboard keeps model names visible during horizontal scrolling. Native buttons, labelled selects, disclosures and a modal dialog support keyboard use. Playback starts on request, and reduced-motion preferences suppress transitions.

## Source and delivery

The root page fetches `data.json` and imports native JavaScript modules. Counts and aggregates derive from the supplied records. The recording count uses unique video paths because the second round reuses Claude’s work. Translated method notes and official claims correspond to the supplied source statements. The footer explains the limits of a single run.

Relative asset paths support GitHub Pages project URLs. Only the selected recording is attached to the evidence player, with preloading disabled. The page uses local assets and has no build step, external font requests or analytics.
