# JC Engine - Generador de Carnets

Aplicación Next.js para generar carnets estudiantiles o empresariales desde Excel, con personalización de plantilla, gestión de fotos y descarga en PDF/ZIP.

## 🚀 Funcionalidades Implementadas

- Carga y validación de archivo Excel (`.xlsx`, `.xls`)
- Soporte de tipos de carnet:
  - Estudiantil (`curso`)
  - Empresarial (`cargo`)
- Plantilla por defecto personalizable:
  - Nombre de institución
  - Logos (institución, SED/alcaldía)
  - Paleta de colores
- Soporte para plantilla personalizada (HTML / imagen)
- Generación de salida:
  - PDF único con todos los carnets
  - ZIP con PDFs individuales

### Gestión de Fotos (implementado)

- **Sin columna `foto` en Excel** (ya no es requerida)
- **ZIP opcional de fotos**:
  - Carga de `.zip` desde la UX
  - Matching por `identificacion` (nombre de archivo)
  - Formatos soportados: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Captura de foto desde la UX (cámara)** para registros faltantes:
  - Tomar/retomar foto por registro
  - Asociación por identificación
- **Fallback automático a placeholder** cuando no hay foto
- Tabla de vista previa con estado de foto:
  - `📷 Capturada`
  - `✅ ZIP`
  - `❌ No encontrada`
  - `Sin foto (placeholder)`

### Reporte post-generación (implementado)

Al finalizar la generación, redirige a `/report` con resumen de:

- Total de carnets procesados
- Con foto / sin foto
- Cobertura (%)
- Fotos detectadas en ZIP
- Fotos capturadas en UX
- Identificaciones sin foto
- IDs en ZIP sin match con Excel
- Botones de acción:
  - Generar nuevos carnets
  - Ir al inicio

## 📋 Estructura del Excel

Columnas requeridas:

| nombres | curso/cargo | identificacion |
|---------|-------------|----------------|
| Juan Pérez | 5to A | 12345678 |
| María López | Analista | 87654321 |

## 🔎 SEO y Branding (implementado)

- Metadatos globales con branding de **JC Engine**
- Metadata por ruta (`/`, `/upload`, `/preview`, `/report`)
- `robots.txt` dinámico
- `sitemap.xml` dinámico
- `manifest.webmanifest`
- `opengraph-image` dinámico
- Favicon e iconos configurados desde `public/`
- Integración opcional de Google Analytics 4

## ⚙️ Variables de Entorno

```bash
# URL pública del sitio (sin slash final)
NEXT_PUBLIC_SITE_URL=https://app-carnets.jcengine.co

# ID de Google Analytics 4 (opcional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 🛠️ Instalación

```bash
# Recomendado: Node 20 LTS
npm install
npm run dev
```

Scripts:

```bash
npm run dev
npm run build
npm run start
```

## 🧯 Nota Windows / OneDrive

Si aparece error `EINVAL: invalid argument, readlink ... .next ...`, el proyecto ya limpia `.next` automáticamente antes de `dev` y `build`.

## 📁 Rutas principales

- `/` landing
- `/upload` flujo de carga y configuración
- `/preview` vista previa de plantilla
- `/report` reporte final post-generación
- `/api/generate` generación PDF/ZIP

## 🧪 Flujo recomendado de uso

1. Ir a `/upload`
2. Seleccionar tipo de carnet
3. Cargar Excel
4. Elegir plantilla (por defecto o personalizada)
5. (Opcional) cargar ZIP de fotos
6. (Opcional) capturar fotos faltantes desde cámara
7. Generar carnets
8. Revisar reporte en `/report`

## 🔮 Pendiente / Roadmap

- Exportar reporte como CSV/XLSX
- Vista de paginación completa para asignación de fotos en lotes grandes
- Edición manual de plantilla en línea
- Historial de generaciones por usuario
- Persistencia de reportes en backend
- Autenticación y roles
- Integración con almacenamiento en nube (S3/Cloudinary)
