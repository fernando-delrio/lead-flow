# Ejemplo de Equipo Solo con Node.js

Proyecto deliberadamente pequeño para observar el flujo sin que el dominio o las dependencias
oculten lo importante.

## Estado inicial

El carrito cobra `4,99 €` de envío cuando contiene productos. No hay descuentos, impuestos ni
persistencia.

```bash
npm test
npm run lint
npm run build
```

Los tres comandos deben terminar correctamente sin instalar dependencias.

## Encargo de la demostración

Abre Claude Code en esta carpeta y pega:

```text
Lee AGENTS.md y CLAUDE.md. Añade envío gratuito cuando el subtotal sea de 50 euros o más.
Incluye el caso exacto de 50 euros, conserva el envío de 4,99 euros por debajo y no hagas Git.
Usa el flujo de agentes y para al cerrar el incremento.
```

## Resultado que se debe poder comprobar

- Un carrito vacío no paga envío.
- Con subtotal `49,99 €`, el envío cuesta `4,99 €`.
- Con subtotal `50,00 €`, el envío es gratuito.
- Con subtotal superior a `50,00 €`, el envío es gratuito.
- Pruebas, lint y build pasan.

El punto de la demostración no es la dificultad del cambio, sino poder ver quién planifica, quién
implementa, qué se comprueba y quién revisa antes de cerrarlo.
