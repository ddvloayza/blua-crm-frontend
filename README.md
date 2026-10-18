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

Las cuentas deben tener un perfil CRM de asesor o administrador en Django. El dashboard de asesores muestra los leads asignados; el administrador puede consultar todos y ver el funnel. La ficha permite registrar gestiones, citas, propuestas y adjuntos.
