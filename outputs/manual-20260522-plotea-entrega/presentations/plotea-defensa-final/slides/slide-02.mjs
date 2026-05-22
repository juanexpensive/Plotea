import { column, panel, row, text } from "@oai/artifact-tool";
import { BG, GREEN, MUTED, SOFT, WHITE, bulletItem, deckFrame, sectionHeading, simpleCard } from "./theme.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  slide.background.fill = BG;

  slide.compose(
    deckFrame(
      row(
        {
          width: "fill",
          height: "fill",
          gap: 36,
          align: "start",
          justify: "start",
        },
        [
          column(
            {
              width: 500,
              gap: 28,
            },
            [
              sectionHeading("Introduccion", "Plotea nace como la app que a mi me gustaria usar", "Una experiencia pensada para registrar, descubrir y decidir rapido.", 500),
              text("La idea no era crear una red social generica, sino una herramienta diaria para tener a mano todo lo visto y encontrar algo nuevo sin friccion.", {
                width: 500,
                style: {
                  fontFamily: "Arial",
                  fontSize: 22,
                  fontWeight: 400,
                  color: SOFT,
                },
              }),
            ],
          ),
          column(
            {
              width: 616,
              gap: 20,
            },
            [
              simpleCard("Que es", "Una app para fomentar ver peliculas como red social, apuntar lo que ves y conocer mas cine.", 616, 150),
              simpleCard("Para quien", "Para un usuario que quiere guardar su historial, decidir rapido que ver y usar funciones como random o decisiones en pareja.", 616, 170),
              panel(
                {
                  width: 616,
                  height: 188,
                  padding: 24,
                  fill: "#202020",
                  borderRadius: 20,
                },
                column(
                  {
                    width: "fill",
                    gap: 14,
                  },
                  [
                    text("Por que mejora Letterboxd", {
                      width: 568,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 24,
                        fontWeight: 700,
                        color: GREEN,
                      },
                    }),
                    bulletItem("Mas agil y mas intuitiva.", 560, 18),
                    bulletItem("Menos cargada y mas comoda en el uso diario.", 560, 18),
                    bulletItem("Pensada como una mejora esencial de Letterboxd.", 560, 18),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  return slide;
}
