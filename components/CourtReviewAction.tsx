"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { createCourtReview } from "@/app/actions/reviews";
import { Modal, TextareaField, ConfirmButton } from "@/components/forms";
import { Notice } from "@/components/ui";

const RATING_LABEL = ["", "Mala", "Regular", "Buena", "Muy buena", "Excelente"];

export function CourtReviewAction({ courtId, courtName }: { courtId: number; courtName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [state, formAction] = useActionState(createCourtReview, undefined);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-amber-400/50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50">Calificar</button>

      <Modal open={open} onClose={() => setOpen(false)} title={`¿Cómo fue ${courtName}?`} description="Tu reseña será visible para otros jugadores.">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="courtId" value={courtId} />
          <input type="hidden" name="rating" value={rating} />

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Calificación</legend>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} estrellas`} onClick={() => setRating(value)} className="rounded-lg p-1 transition hover:scale-110">
                  <Star size={28} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-border"} />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-muted-foreground">{RATING_LABEL[rating]}</span>
            </div>
          </fieldset>

          <TextareaField id={`comment-${courtId}`} name="comment" label="Comentario" optional rows={4} maxLength={500} placeholder="Cuéntanos sobre la cancha…" />

          {state?.error && <Notice tone="error">{state.error}</Notice>}
          {state?.success && <Notice tone="success">{state.success}</Notice>}
          <ConfirmButton message="Tu reseña se publicará y será visible para otros jugadores." confirmLabel="Sí, publicar" pendingText="Enviando…"><Star size={16} />Publicar reseña</ConfirmButton>
        </form>
      </Modal>
    </>
  );
}
