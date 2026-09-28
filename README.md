# Computational MSTN siRNA research explorer

**Soobin Lim · Computational research project**

[Open the interactive presentation](https://suelim04.github.io/mstn-sirna-explorer/)

This project explores an MSTN siRNA construction starting point through sequence analysis, retrospective reporter evidence, explicit chemical identities and molecular modelling. The site presents the results, supporting records and proposed next experiments.

## Explore the presentation

Use **Next step**, **Previous step**, or the step menu to move through the eight-part story. Tabs separate figures and related results within a step. **Explore full records** opens the detailed research workspaces; **Return to step** returns to the story.

| Step | What it covers |
|---|---|
| 1. Question & scope | Myostatin signalling and the proposed point of siRNA action |
| 2. Sequence evidence | Reference selection, 19-base windows, duplex architecture, eligibility and bounded match searches |
| 3. Evaluation & earlier panel | Reporter contrasts and a separate eight-member marginal-coverage panel |
| 4. One starting point | The declared selection path from 176 eligible windows to one construction candidate |
| 5. Exact chemistry | Twelve proposed chemical identities and their component connections |
| 6. Inspect the molecule | Annotated PyMOL views, interactive atoms and the standalone construction method |
| 7. Structural limits | Why the receptor-based reconstruction failed its geometric criterion before linker comparison |
| 8. Next measurements | Proposed reagent review, controls and RNA, protein, viability and GDF11 readouts |

In **Sequence**, the candidate table supports searching, filtering, sorting and inspection of all 176 records. In **Structure**, use the fixed molecular views or **Interactive atoms** to inspect the generated conformation. Scientific sources and methods are linked from the relevant workspaces.

## Selected results

- **Sequence eligibility:** 176 of 2,801 windows were eligible; 2,321 were excluded and 304 remained incomplete. Composition and exact mouse-site conservation determined eligibility; potential-match counts were reported separately.
- **Construction candidate:** transcript interval **[455,474)** of ENST00000260950.5, using zero-based, half-open coordinates. A later, outcome-aware preference selected this starting point; it is not a potency ranking.
- **Chemical design:** twelve explicitly defined proposed identities; **BCY17868_L6_M0** is the illustrated example.
- **Standalone model:** 1,027 heavy atoms and 1,137 covalent bonds. It has zero overlaps above 0.6 Å under the declared diagnostic, with 17 above the stricter 0.4 Å threshold.
- **Receptor comparison:** the fixed peptide reconstruction failed its geometric criterion. No linker or peptide-handle ranking was produced.

## Interpretation and limits

This is a computational study. No synthesis, receptor-binding, delivery, knockdown or safety experiment was performed. Mouse conservation establishes bounded sequence compatibility only. The retrospective reporter association has unresolved independence and rule-development overlap limitations and does not predict MSTN activity. The molecular view is one generated conformation, not an experimental structure or a preferred solution shape.

The eight-member coverage panel contains four windows in one overlapping cluster and samples five merged transcript locations. Feature coverage does not establish independent sites or per-feature biological effects. Proposed experimental readouts do not establish transcriptome-wide specificity.

## Files and supporting records

- [`index.html`](index.html) — interactive explorer.
- [Package guide](https://suelim04.github.io/mstn-sirna-explorer/README.html) — navigation and offline use.
- [Research brief](https://suelim04.github.io/mstn-sirna-explorer/review_brief.html) — findings and interpretation.
- [Evidence index](https://suelim04.github.io/mstn-sirna-explorer/evidence_notes.html) — methods, results and sources.
- [`records/data/`](records/data/) — candidate table, chemical identity, coordinates, reporter results and source manifest.
- [`pymol/`](pymol/) — rendered views, saved PyMOL session and rendering guide.

The website's assets and research records are included locally. To use an offline copy, download the repository ZIP, extract it, keep the folders together and open `index.html` in a modern browser. External source citations require internet access. This repository is an audience-facing static site; the full analysis environment and large reference downloads are not bundled.
