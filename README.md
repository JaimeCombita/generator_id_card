# Generador de Carnets Estudiantiles

Aplicación Next.js para generar carnets de estudiantes a partir de archivos Excel.

## 🚀 Características

- ✅ Carga de archivo Excel con datos de estudiantes
- ✅ Plantilla por defecto personalizable con vista previa
- ✅ Configuración avanzada de plantilla:
  - Personalización del nombre del colegio
  - Opción de incluir/excluir logo de la Secretaría de Educación de Bogotá
  - Carga de logo alternativo de alcaldía
  - Carga de logo personalizado del colegio
- ✅ Soporte para plantillas personalizadas (imagen PNG/JPG o HTML)
- ✅ Generación de PDFs en dos modos:
  - Un solo PDF con todos los carnets
  - PDFs individuales por carnet (ZIP)
- ✅ Vista previa de datos antes de generar
- ✅ Interfaz moderna con Tailwind CSS
- ✅ Conversión automática de logos a base64 para PDFs

## 📋 Estructura del Excel

Tu archivo Excel debe contener las siguientes columnas:

| nombres | curso | identificacion | foto (opcional) |
|---------|-------|----------------|-----------------|
| Juan Pérez | 5to A | 12345678 | /ruta/foto.jpg |
| María López | 5to B | 87654321 | |

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

## 📦 Despliegue en Vercel

1. Sube tu repositorio a GitHub
2. Importa el proyecto en Vercel
3. Vercel detectará automáticamente la configuración de Next.js
4. Deploy automático

## 🎨 Tecnologías

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Puppeteer (generación de PDFs desde HTML)
- xlsx (lectura de Excel)
- JSZip (compresión de múltiples PDFs)

## 📁 Estructura del Proyecto

```
/app      - Página de carga de archivos
  /api/generate          - API para generar PDFs
/components
  /ExcelUploader.tsx     - Componente de carga de Excel
  /TemplateUploader.tsx  - Componente de carga/selección de plantilla
  /TemplateConfiguration.tsx - Configuración de plantilla por defecto
  /GenerateOptions.tsx   - Opciones de generación de PDFs
/public
  /templates             - Plantillas de carnets y logos
  /uploads      es       - Plantillas de carnets
  /uploads         - Archivos temporales
```

## 📝 Uso

1. Accede a la página principal
2. Haz clic en "Comenzar"
3. Sube tu archivo Excel con los datos de estudiantes
4. Selecciona si deseas usar la plantilla por defecto o una personalizada:
   
   **Opción A: Plantilla por defecto**
   - Marca "Usar plantilla por defecto"
   - Visualiza la vista previa de la plantilla
   - Personaliza el nombre del colegio
   - Decide si incluir el logo de la Secretaría de Educación
   - Opcionalmente, sube logos personalizados (colegio y/o alcaldía)
   
   **Opción B: Plantilla personalizada**
   - Desmarca "Usar plantilla por defecto"
   - Sube tu propia plantilla (HTML, PNG o JPG)
Mejoras Recientes

- ✅ Plantilla por defecto con vista previa interactiva
- ✅ Personalización del nombre del colegio
- ✅ Sistema de gestión de logos (colegio y secretaría)
- ✅ Opción de logo alternativo de alcaldía
- ✅ Conversión automática de imágenes a base64

## 🔮 Próximas Mejoras

- [ ] Soporte para fotos de estudiantes desde el Excel
- [ ] Editor de plantillas HTML en línea
- [ ] Historial de generaciones
- [ ] Personalización de posición de campos con drag & drop
- [ ] Exportación de plantillas personalizada
- [ ] Soporte para fotos en el Excel
- [ ] Editor de plantillas HTML en línea
- [ ] Generación de ZIP para múltiples PDFs
- [ ] Historial de generaciones
- [ ] Personalización de posición de campos
