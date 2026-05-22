import { BG, deckFrame, sectionHeading, simpleCard } from "./theme.mjs";
import { column, row } from "@oai/artifact-tool";

export async function slide06(presentation, ctx) {
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
          sectionHeading("Mejoras futuras", "La base esta hecha, ahora toca ampliar valor", "Las siguientes ideas refuerzan sobre todo el descubrimiento y la personalizacion.", 920),
          row(
            {
              width: "fill",
              gap: 18,
            },
            [
              simpleCard("Wrapped", "Un resumen anual o mensual al estilo Spotify con datos de visionado.", 273, 240),
              simpleCard("Descubrir usuarios", "Localizar perfiles afines y potenciar la parte social de la app.", 273, 240),
              simpleCard("Sugerencias inteligentes", "Recomendaciones por actor, director y criterios relacionados.", 273, 240),
              simpleCard("Decision mas rapida", "Mejorar todavia mas la ayuda para saber que ver en cada momento.", 273, 240),
            ],
          ),
        ],
      ),
    ),
  );

  return slide;
}
