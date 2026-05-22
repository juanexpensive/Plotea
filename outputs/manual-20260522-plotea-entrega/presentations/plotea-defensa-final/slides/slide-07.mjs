import { BG, GREEN, MUTED, SOFT, WHITE, bulletItem, deckFrame, sectionHeading } from "./theme.mjs";
import { column, panel, row, text } from "@oai/artifact-tool";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  slide.background.fill = BG;

  slide.compose(
    deckFrame(
      column(
        {
          width: "fill",
          height: "fill",
          gap: 34,
        },
        [
          sectionHeading("Conclusiones", "Plotea me ha servido para aprender a construir mejor", "El resultado final no se parece del todo a la idea inicial, pero eso tambien forma parte del aprendizaje.", 900),
          panel(
            {
              width: 1152,
              height: 290,
              padding: 30,
              fill: "#202020",
              borderRadius: 24,
            },
            row(
              {
                width: "fill",
                height: "fill",
                gap: 28,
                align: "start",
                justify: "start",
              },
              [
                column(
                  {
                    width: 620,
                    gap: 18,
                  },
                  [
                    bulletItem("He aprendido a trabajar mas paso a paso.", 620, 21),
                    bulletItem("He aprendido a crear el proyecto de forma mas granular, separando mejor en componentes.", 620, 21),
                    bulletItem("Termino contento por haber podido sacar adelante una app completa y funcional.", 620, 21),
                  ],
                ),
                column(
                  {
                    width: 420,
                    gap: 14,
                  },
                  [
                    text("Idea inicial vs resultado final", {
                      width: 420,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 24,
                        fontWeight: 700,
                        color: GREEN,
                      },
                    }),
                    text("La aplicacion final no se parece exactamente a lo que habia imaginado al principio, pero ha evolucionado hacia algo mas realista, mas util y mejor construido.", {
                      width: 420,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 19,
                        fontWeight: 400,
                        color: MUTED,
                      },
                    }),
                  ],
                ),
              ],
            ),
          ),
          text("Plotea demuestra que una idea personal puede convertirse en un producto completo cuando se baja a tierra con decisiones tecnicas y funcionales claras.", {
            width: 1040,
            style: {
              fontFamily: "Arial",
              fontSize: 26,
              fontWeight: 700,
              color: WHITE,
            },
          }),
        ],
      ),
    ),
  );

  return slide;
}
