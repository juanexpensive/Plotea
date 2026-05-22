import { column, panel, row, text } from "@oai/artifact-tool";
import { BG, GREEN, MUTED, WHITE, deckFrame, sectionHeading, statCard } from "./theme.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  slide.background.fill = BG;

  const phases = [
    ["01", "Auth", "Base de acceso, sesion y persistencia."],
    ["02", "Home", "Pantalla principal y descubrimiento inicial."],
    ["03", "Perfil", "Historial personal, stats y seguimiento propio."],
    ["04", "Social", "Interaccion entre usuarios, comentarios y actividad."],
    ["05", "Listas", "Organizacion de peliculas y colaboracion."],
  ];

  slide.compose(
    deckFrame(
      column(
        {
          width: "fill",
          height: "fill",
          gap: 34,
        },
        [
          sectionHeading("Desarrollo", "El proyecto crecio por fases funcionales", "Primero se consolidaron las bases y despues se anadio la capa social.", 900),
          row(
            {
              width: "fill",
              gap: 16,
              align: "start",
              justify: "start",
            },
            phases.map(([kicker, title, body]) => statCard(kicker, title, body, 214, 180)),
          ),
          panel(
            {
              width: 1152,
              height: 180,
              padding: 28,
              fill: "#202020",
              borderRadius: 22,
            },
            row(
              {
                width: "fill",
                height: "fill",
                gap: 28,
                align: "center",
                justify: "start",
              },
              [
                column(
                  {
                    width: 280,
                    gap: 10,
                    justify: "center",
                  },
                  [
                    text("Lo que mejor representa Plotea", {
                      width: 280,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 28,
                        fontWeight: 700,
                        color: GREEN,
                      },
                    }),
                    text("La parte mas propia del proyecto esta en la opinion, la conversacion y la decision de que ver.", {
                      width: 280,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 17,
                        fontWeight: 400,
                        color: MUTED,
                      },
                    }),
                  ],
                ),
                row(
                  {
                    width: 760,
                    gap: 18,
                  },
                  [
                    statCard("Clave", "Reseñas", "Permiten registrar opinion y valorar peliculas de forma personal.", 240, 124),
                    statCard("Clave", "Comentarios", "Aportan la parte social y la conversacion sobre lo visto.", 240, 124),
                    statCard("Clave", "Random", "Ayuda a decidir rapido que ver, incluso en pareja.", 240, 124),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );

  return slide;
}
