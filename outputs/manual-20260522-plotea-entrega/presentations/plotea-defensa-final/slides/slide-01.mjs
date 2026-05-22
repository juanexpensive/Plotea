import fs from "node:fs/promises";
import { column, image, panel, row, text } from "@oai/artifact-tool";

const BG = "#1c1c1c";
const GREEN = "#3ecf8e";
const WHITE = "#ffffff";
const MUTED = "#9a9a9a";
const LOGO = "C:/Users/Juan/Documents/PlotSkip/Plotea.png";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  slide.background.fill = BG;
  const logoBytes = await fs.readFile(LOGO);
  const logoDataUrl = `data:image/png;base64,${logoBytes.toString("base64")}`;

  slide.compose(
    panel(
      {
        width: 1280,
        height: 720,
        padding: 64,
        fill: BG,
      },
      row(
        {
          width: "fill",
          height: "fill",
          gap: 40,
          justify: "center",
          align: "center",
        },
        [
          image({
            dataUrl: logoDataUrl,
            width: 460,
            height: 460,
            fit: "contain",
          }),
          column(
            {
              width: 520,
              gap: 18,
              justify: "center",
              align: "start",
            },
            [
              text("Plotea", {
                width: 520,
                style: {
                  fontFamily: "Arial",
                  fontSize: 28,
                  fontWeight: 700,
                  color: GREEN,
                },
              }),
              text("Presentacion TFG", {
                width: 520,
                style: {
                  fontFamily: "Arial",
                  fontSize: 54,
                  fontWeight: 700,
                  color: WHITE,
                },
              }),
              text("Red social para registrar lo que ves, descubrir peliculas y decidir rapido que ver", {
                width: 520,
                style: {
                  fontFamily: "Arial",
                  fontSize: 22,
                  fontWeight: 400,
                  color: MUTED,
                },
              }),
              text("Juan Caro Vaquero  |  DAM 2025-2026", {
                width: 520,
                style: {
                  fontFamily: "Arial",
                  fontSize: 16,
                  fontWeight: 400,
                  color: "#7d7d7d",
                },
              }),
            ],
          ),
        ],
      ),
    ),
  );

  return slide;
}
