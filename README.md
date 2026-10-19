# Blua CRM frontend

Aplicación independiente para asesores y administradores del CRM. Usa el mismo backend Django de `blua-investment` mediante GraphQL, autenticación por cookies y carga de adjuntos. No guarda una copia de los leads.

## Desarrollo local

1. Copia `.env.example` a `.env.local`. El ejemplo apunta al Django local en `http://localhost:8000`; si usas otro backend, cambia las cuatro URL.
2. Ejecuta `npm ci` y `npm run dev`.
3. Abre `http://localhost:3000/signin`.

## Amplify

Conecta este repositorio como una app de Amplify independiente. El archivo `amplify.yml` instala dependencias y compila Next.js 15. Configura las cuatro variables `NEXT_PUBLIC_*_ENDPOINT` antes de compilar. Todas deben apuntar al mismo backend Django.

Después de publicar, agrega el dominio `crm.blua.pe` a esta app de Amplify. El backend ya acepta ese origen en CORS y CSRF. Para probar primero en un dominio provisional de Amplify, configura `CRM_PREVIEW_ORIGIN` en Django con el origen exacto del nuevo sitio; algunas sesiones pueden verse afectadas por el bloqueo de cookies de terceros hasta usar el subdominio final.

## Acceso

Las cuentas reciben el rol mediante los grupos de Django `CRM Asesores` y `CRM Administradores`. El dashboard de asesores muestra los leads asignados; el administrador ve el avance del equipo y el funnel. Desde Supervisión puede descargar un `.xlsx` con el resumen, el progreso por asesor y la distribución de prospectos por estado. La exportación refleja el filtro de asesor seleccionado y la fecha de corte; es una fotografía de los datos actuales. La ficha permite registrar gestiones, citas, propuestas y adjuntos.

## Simulaciones comerciales

En la ficha de un prospecto asignado, **Simular inversión** permite elegir fondo, moneda, plazo, frecuencia mensual o trimestral, monto y fecha estimada de inicio. El plan activo se elige automáticamente según el rango del capital y los demás parámetros. Django calcula y guarda la simulación en `crm.AdvisorSimulation`, ligada al lead, al asesor y al usuario cliente cuando existe. Las simulaciones realizadas por el cliente permanecen en `investment.InvestmentSimulation`. El cuadro muestra intereses brutos estimados por período y la devolución del capital al vencimiento. Se puede imprimir o guardar como PDF desde el navegador. Es una proyección referencial; no emite un contrato ni considera retenciones, comisiones o días no hábiles.

Antes de usar esta pantalla en un nuevo entorno, aplica las migraciones del backend hasta `crm.0011_advisorsimulation` para crear la tabla comercial y asignar sus permisos a los grupos CRM.
