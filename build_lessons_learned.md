# Resumen de Errores y Lecciones Aprendidas (FlexibilidadCognitiva)

Este documento resume los retos técnicos encontrados durante el desarrollo y la configuración de este proyecto. Guárdalo para evitar estos problemas en tus futuros despliegues (Cloudflare, Vercel, etc.).

---

## 1. Gestión de Git y Repositorio (Crítico)

> [!CAUTION]
> **Nunca** inicies un repositorio sin un archivo `.gitignore` configurado.

*   **Problema:** Se subieron carpetas pesadas (`node_modules`, `.next`) al historial de Git.
*   **Consecuencia:** El repositorio se vuelve extremadamente pesado, GitHub puede bloquear el `push` por exceso de tamaño y el despliegue en la nube fallará.
*   **Solución para el futuro:**
    1. Antes del primer `git add .`, crea un archivo `.gitignore`.
    2. Asegúrate de incluir: `node_modules/`, `.next/`, `.env.local`, y `dist/`.
    3. Si ya subiste archivos por error, usa `git rm -r --cached .` para limpiar el índice antes de volver a agregar.

---

## 2. Dependencias y Entorno de Build

*   **Problema:** Error `Cannot find module 'autoprefixer'`.
*   **Causa:** A veces, las instalaciones de `npm` quedan incompletas o se omiten dependencias necesarias para PostCSS/Tailwind.
*   **Lección:** Si ves que el build falla en el paso de CSS, verifica que tienes instalado `autoprefixer` y `postcss`. Cloudflare Pages es muy estricto con las dependencias listadas en tu `package.json`.

---

## 3. Configuración de Supabase y OAuth

*   **Problema:** Login con Google fallido por el uso de "placeholders".
*   **Lección:** 
    *   Verifica siempre que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` coincidan con tu proyecto activo.
    *   **Callback URL:** En Google Console, la URL de redireccionamiento debe ser exactamente la que te da Supabase (termina en `/auth/v1/callback`).
    *   **CORS:** Asegúrate de que las URLs de tu sitio (ej. `localhost:3000` o `tu-sitio.pages.dev`) estén en la "Allow List" de Supabase Authentication.

---

## 4. Lógica de React: Stale Closures (Cierres obsoletos)

*   **Problema:** El estado del test (aciertos, regla actual) no se actualizaba correctamente dentro de funciones asíncronas (`setTimeout`).
*   **Causa:** Las funciones en React "capturan" el valor de las variables en el momento en que se crean. Si usas un valor de estado dentro de un `setTimeout`, este usará el valor "viejo".
*   **Solución:** Usa `useRef` para valores que necesiten ser leídos de forma síncrona/inmediata dentro de procesos largos o temporizadores, o utiliza la versión funcional de `setState` (ej. `setCount(prev => prev + 1)`).

---

## 5. Diseño y Tailwind CSS

*   **Problema:** Elementos con tamaño incorrecto (`h-38`) y animaciones que no se ejecutaban.
*   **Lección:** 
    *   Tailwind usa una escala estándar. Si usas valores arbitrarios como `h-[155px]`, usa corchetes. `h-38` no existe, lo correcto es `h-40`.
    *   Las animaciones personalizadas deben estar declaradas **tanto** en `tailwind.config.ts` como en `globals.css` si usas la sintaxis `animate-[nombre_...]`.

---

## 6. Tips para Cloudflare Pages

Si vas a mover este o nuevos proyectos a Cloudflare:
1.  **Compatibilidad de Node.js:** Asegúrate de configurar la variable de entorno `NODE_VERSION` en el panel de Cloudflare (ej. `18` o `20`).
2.  **Edge Runtime:** Supabase requiere configuraciones específicas para funcionar en el Edge Runtime de Cloudflare. Usa siempre `@supabase/ssr` para Next.js.
3.  **Variables de Entorno:** Todas las variables de `.env.local` deben cargarse manualmente en el panel de Cloudflare Pages (Settings -> Variables and Secrets).
