# Design-System Exhibits

Exhibits are reusable, named design patterns stored in the design token set.
They are not only a gallery: they can be exported, placed into pages/iParts,
edited for copy/data, and promoted as reusable patterns when a job creates
something worth keeping.

## Use Existing Exhibits

Call:

```text
imis_design_system action="export_exhibit" exhibitId="<id>"
```

Normal iMIS placement should use the returned scoped `html`/`placeArgs`. The
ContentHtml or page-builder writer owns the canonical CSS binding and records
the `designContract`.

`portableHtml` is only for manual portability or a foreign host that cannot use
the AgentZ writers. It includes enough CSS to render on its own, so do not use
it as the default iMIS write path.

After placement, edit copy, labels, data bindings, and actions to fit the page.
Keep the `.agentz-design` scope wrapper and provenance comment.

## Create A New Exhibit

When no existing exhibit fits:

1. Build the pattern for the current job using scoped token CSS.
2. Verify it in the page or runtime where it will live.
3. If it is likely to be reused, propose promoting it to the design system.
4. Add it to `tokens.exhibits[]` only through
   `imis_design_system action="preview_update"` and confirmed `update`.

Promotion is deliberate. A one-off page section can stay local; a reusable
hero, dashboard shell, card gallery, command surface, KPI strip, alert panel,
or chart shell should become an exhibit when it represents a repeatable
pattern.

## Exhibit Shape

Each exhibit has:

- `id`: stable lowercase id.
- `title`: user-facing pattern name.
- `section`: optional grouping such as Brand, Dashboards, Events, Content.
- `html`: sanitized scoped markup composed from generic kit classes, brand kit
  classes, and local structure.

Exhibits should be more than recolored generic cards. A strong exhibit captures
composition: hierarchy, rhythm, structure, and brand behavior.
