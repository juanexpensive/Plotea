import { column, panel, row, text } from "@oai/artifact-tool";
import { BG, GREEN, MUTED, SOFT, deckFrame, sectionHeading, simpleCard } from "./theme.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  slide.background.fill = BG;

  slide.compose(
    deckFrame(
      column(
        {
          width: "fill",
          height: "fill",
          gap: 30,
        },
        [
          sectionHeading("Arquitectura", "Una base tecnica sencilla, clara y mantenible", "Frontend movil, backend propio y una sola API externa principal.", 900),
          row(
            {
              width: "fill",
              gap: 18,
            },
            [
              simpleCard("Mobile", "React Native con Expo, Expo Notifications, FCM en Android y builds con EAS.", 372, 240),
              simpleCard("Backend", "Python con FastAPI, Uvicorn, SQLAlchemy async y Alembic sobre PostgreSQL.", 372, 240),
              simpleCard("Servicios", "TMDB API para catalogo, Railway para despliegue y Resend para correos.", 372, 240),
            ],
          ),
          panel(
            {
              width: 1152,
              height: 188,
              padding: 28,
              fill: "#202020",
              borderRadius: 22,
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
                    width: 360,
                    gap: 12,
                  },
                  [
                    text("Patron general", {
                      width: 360,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 24,
                        fontWeight: 700,
                        color: GREEN,
                      },
                    }),
                    text("Cliente movil  →  API propia  →  Base de datos y servicios externos", {
                      width: 360,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 20,
                        fontWeight: 400,
                        color: SOFT,
                      },
                    }),
                  ],
                ),
                column(
                  {
                    width: 320,
                    gap: 10,
                  },
                  [
                    text("Organizacion", {
                      width: 320,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 24,
                        fontWeight: 700,
                        color: GREEN,
                      },
                    }),
                    text("Clean Architecture para separar dominio, datos, presentacion e infraestructura.", {
                      width: 320,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 18,
                        fontWeight: 400,
                        color: MUTED,
                      },
                    }),
                  ],
                ),
                column(
                  {
                    width: 360,
                    gap: 10,
                  },
                  [
                    text("Objetivo tecnico", {
                      width: 360,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 24,
                        fontWeight: 700,
                        color: GREEN,
                      },
                    }),
                    text("Mantener el proyecto escalable, desplegable y facil de seguir durante el desarrollo.", {
                      width: 360,
                      style: {
                        fontFamily: "Arial",
                        fontSize: 18,
                        fontWeight: 400,
                        color: MUTED,
                      },
                    }),
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
