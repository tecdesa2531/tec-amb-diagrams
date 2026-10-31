// Registro de atajos de teclado (Ctrl en Windows/Linux, Cmd en Mac).

export function iniciar(acciones) {
    document.addEventListener("keydown", e => {
        const enInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
        const ctrl = e.ctrlKey || e.metaKey;

        if (enInput) {
            // Solo Escape se propaga desde inputs para cancelar el editor
            if (e.key === "Escape") acciones.escape?.();
            return;
        }

        if (ctrl && !e.shiftKey && e.key.toLowerCase() === "s") { e.preventDefault(); acciones.guardar?.(); return; }
        if (ctrl && e.shiftKey  && e.key.toLowerCase() === "s") { e.preventDefault(); acciones.guardarComo?.(); return; }
        if (ctrl && !e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); acciones.deshacer?.(); return; }
        if (ctrl && e.shiftKey  && e.key.toLowerCase() === "z") { e.preventDefault(); acciones.rehacer?.(); return; }
        if (ctrl && !e.shiftKey && e.key.toLowerCase() === "y") { e.preventDefault(); acciones.rehacer?.(); return; }
        if (ctrl && e.shiftKey  && e.key.toLowerCase() === "h") { e.preventDefault(); acciones.ajustar?.(); return; }
        if (ctrl && !e.shiftKey && e.key.toLowerCase() === "a") { e.preventDefault(); acciones.seleccionarTodo?.(); return; }
        if (ctrl && !e.shiftKey && e.key.toLowerCase() === "c") { e.preventDefault(); acciones.copiar?.(); return; }
        if (ctrl && !e.shiftKey && e.key.toLowerCase() === "v") { e.preventDefault(); acciones.pegar?.(); return; }
        if (ctrl && !e.shiftKey && e.key.toLowerCase() === "d") { e.preventDefault(); acciones.duplicar?.(); return; }

        if (e.key === "Delete" || e.key === "Backspace") { acciones.eliminar?.(); return; }
        if (e.key === "Escape") { acciones.escape?.(); return; }

        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            const d = e.shiftKey ? 10 : 1;
            const dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0;
            const dy = e.key === "ArrowUp"   ? -d : e.key === "ArrowDown"  ? d : 0;
            acciones.moverFlecha?.(dx, dy);
        }
    });
}
