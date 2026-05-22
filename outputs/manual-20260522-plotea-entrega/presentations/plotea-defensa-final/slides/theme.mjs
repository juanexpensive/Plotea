import { column, panel, row, text } from "@oai/artifact-tool";

export const BG = "#1c1c1c";
export const SURFACE = "#202020";
export const SURFACE_ALT = "#262626";
export const GREEN = "#3ecf8e";
export const GREEN_DEEP = "#24b47e";
export const WHITE = "#ffffff";
export const MUTED = "#9a9a9a";
export const SOFT = "#d7d7d7";

export function deckFrame(child, padding = 64) {
  return panel(
    {
      width: 1280,
      height: 720,
      padding,
      fill: BG,
    },
    child,
  );
}

export function sectionHeading(eyebrow, title, subtitle = null, titleWidth = 720) {
  const children = [
    text(eyebrow, {
      width: titleWidth,
      style: {
        fontFamily: "Arial",
        fontSize: 18,
        fontWeight: 700,
        color: GREEN,
      },
    }),
    text(title, {
      width: titleWidth,
      style: {
        fontFamily: "Arial",
        fontSize: 42,
        fontWeight: 700,
        color: WHITE,
      },
    }),
  ];

  if (subtitle) {
    children.push(
      text(subtitle, {
        width: titleWidth,
        style: {
          fontFamily: "Arial",
          fontSize: 20,
          fontWeight: 400,
          color: MUTED,
        },
      }),
    );
  }

  return column(
    {
      width: titleWidth,
      gap: 12,
      align: "start",
      justify: "start",
    },
    children,
  );
}

export function bulletItem(value, width = 520, size = 20, color = SOFT) {
  return row(
    {
      width,
      gap: 14,
      align: "start",
      justify: "start",
    },
    [
      text("•", {
        width: 16,
        style: {
          fontFamily: "Arial",
          fontSize: size,
          fontWeight: 700,
          color: GREEN,
        },
      }),
      text(value, {
        width: width - 30,
        style: {
          fontFamily: "Arial",
          fontSize: size,
          fontWeight: 400,
          color,
        },
      }),
    ],
  );
}

export function simpleCard(title, body, width = 360, height = 180) {
  return panel(
    {
      width,
      height,
      padding: 24,
      fill: SURFACE,
      borderRadius: 20,
      align: "start",
      justify: "start",
    },
    column(
      {
        width: "fill",
        height: "fill",
        gap: 14,
        align: "start",
        justify: "start",
      },
      [
        text(title, {
          width: width - 48,
          style: {
            fontFamily: "Arial",
            fontSize: 24,
            fontWeight: 700,
            color: GREEN,
          },
        }),
        text(body, {
          width: width - 48,
          style: {
            fontFamily: "Arial",
            fontSize: 18,
            fontWeight: 400,
            color: SOFT,
          },
        }),
      ],
    ),
  );
}

export function statCard(kicker, title, body, width = 340, height = 190) {
  return panel(
    {
      width,
      height,
      padding: 24,
      fill: SURFACE_ALT,
      borderRadius: 22,
      align: "start",
      justify: "start",
    },
    column(
      {
        width: "fill",
        height: "fill",
        gap: 12,
      },
      [
        text(kicker, {
          width: width - 48,
          style: {
            fontFamily: "Arial",
            fontSize: 14,
            fontWeight: 700,
            color: GREEN_DEEP,
          },
        }),
        text(title, {
          width: width - 48,
          style: {
            fontFamily: "Arial",
            fontSize: 26,
            fontWeight: 700,
            color: WHITE,
          },
        }),
        text(body, {
          width: width - 48,
          style: {
            fontFamily: "Arial",
            fontSize: 17,
            fontWeight: 400,
            color: MUTED,
          },
        }),
      ],
    ),
  );
}
