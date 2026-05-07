Iniciar trabajo en una tarea del canvas.

Pasos:
1. Ejecutar: `python3 canvas-tool.py office_planning.canvas status $ARGUMENTS`
2. Si la tarea tiene dependencias sin resolver, informar y esperar.
3. Si puede iniciar, ejecutar: `python3 canvas-tool.py office_planning.canvas start $ARGUMENTS`
4. Leer la spec correspondiente en `.ai/specs/` si existe.
5. Si no existe la spec, informar al usuario antes de continuar.
6. Mostrar resumen de la tarea: estado, dependencias, AC principales.
