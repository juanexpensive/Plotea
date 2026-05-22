import { BG, deckFrame, sectionHeading, simpleCard } from "./theme.mjs";
import { column, row } from "@oai/artifact-tool";

export async function slide05(presentation, ctx) {
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
          sectionHeading("Dificultades", "No fue un proyecto facil de cerrar", "Los problemas principales estuvieron en el entorno, el tiempo y la validacion.", 900),
          row(
            {
              width: "fill",
              gap: 20,
            },
            [
              simpleCard("Entornos distintos", "Desarrollar en varios PCs obligo a resolver diferencias de configuracion y continuidad.", 566, 200),
              simpleCard("Presion final", "La ultima semana concentro mucho estres y exigio cerrar demasiadas cosas a la vez.", 566, 200),
            ],
          ),
          row(
            {
              width: "fill",
              gap: 20,
            },
            [
              simpleCard("Mas complejo de lo esperado", "Al principio parecia un proyecto mas sencillo de lo que realmente termino siendo.", 566, 200),
              simpleCard("Testing", "Probar y validar cada parte, y sobre todo que todo funcionara junto, llevo bastante esfuerzo.", 566, 200),
            ],
          ),
        ],
      ),
    ),
  );

  return slide;
}
