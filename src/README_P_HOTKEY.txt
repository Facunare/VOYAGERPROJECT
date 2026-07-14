Cambio agregado:
- Ahora al tocar la tecla P se activa/desactiva el modo sin títulos.
- Ignora la tecla P si el usuario está escribiendo en input, textarea, select o contenteditable.
- Usa un guard global para no registrar el evento múltiples veces aunque varios componentes usen el hook.

Archivo principal modificado:
- useNarrativeTitlesHidden.js

Si ya reemplazaste los archivos del ZIP anterior, con reemplazar solo este archivo alcanza.
