# Product decisions and validation

## Direction

Little Wonders is now one coherent play experience. A quiet, richly illustrated home offers three places, each containing two activities. Repeated visual controls, three recurring companions, and shared settings replace the disconnected entry points. The unfinished route leads to a complete activity.

The custom environments were generated for this project. Responsive WebP sources keep the three small home images to approximately 252 KB combined; the three full environments total approximately 761 KB. The brand symbol is a vector mark with local PNG install icons. There are no third-party font requests in the new world.

## Learning principles

The design draws on NAEYC’s emphasis on intentional, active, developmentally appropriate interactive media and opportunities for adult involvement:

- https://www.naeyc.org/resources/topics/technology-and-media/resources
- https://www.naeyc.org/files/naeyc/file/positions/ps_technology_web2.pdf

Five short rounds form a natural stopping point; “All done” ends in a quiet screen. No time pressure, loss of earned rewards, streaks, or purchases. Adult-facing progress counts are explicitly play history rather than assessment. The science game rewards making a prediction and observing the result, regardless of the prediction.

Counting starts at 1–3 and reaches 10. Letters progress from uppercase matching to case correspondence and first-letter identification. Shapes move from outlines to combined shape/colour attributes; visual labels supplement colour. Patterns include AB, AAB, and ABC. Musical echoes start at two notes and grow to five; visual cues and numbered keyboard controls support sound-off play. Free music has no forced ending.

Science objects are explicitly specified because material, shape, and trapped air affect buoyancy: cork, a solid metal spoon, a typical wooden block, an ordinary stone, and a capped empty bottle. Explanations avoid claiming that all wood floats or all rocks sink. The activity is an illustrated example, not a physics simulator. At-home water play is suggested only with a grown-up.

## Accessibility intentions

Use native buttons, links, headings, modal dialogs, and settings fields. Offer a visible focus ring, skip link, status feedback, repeat control, reduced-motion support, and no pointer-only drag requirements. Keep primary game targets substantially larger than the WCAG 2.2 minimum:

- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced

These are implementation choices, not certification. The original canvas adventures retain their original accessibility limitations and are described separately in the grown-up corner.

## Completed automated checks

Run `npm test` and `npm run check` for reproducible results. Tests exercise thousands of generated rounds, full DOM flows through all activities, repeat taps, incorrect choices, hints, replay, free music, parent gating, reset cancellation, unavailable storage, and pause/exit timer cleanup. Service-worker tests cover isolation between all three worlds and safe fallbacks under a GitHub Pages subpath. Static checks cover all JavaScript syntax and local HTML, manifest, and precache references.

## Release checks requiring real people and devices

The implementation has not been play-tested with children. Before presenting it as a validated early-learning product:

1. Test Safari on the target iPad and iPhone, in both orientations, with sound on/off and after adding to the home screen.
2. Test VoiceOver, keyboard-only play, 200% text size, reduced motion, offline revisit, and denied storage.
3. Observe caregiver-supervised children in both age groups. Look for independent starts, understood prompts, accidental taps, fatigue, and stopping behavior. Adjust from observation.
4. Review educational content with an early-childhood educator and conduct a full accessibility audit before making compliance or learning-outcome claims.

Awards and “world class” status cannot be established by code review. This change aims for a much stronger, reviewable product and records where empirical validation remains necessary.
