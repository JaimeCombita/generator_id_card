# Generador de Carnets Estudiantiles

Aplicación Next.js para generar carnets de estudiantes a partir de archivos Excel.

## 🚀 Características

- ✅ Carga de archivo Excel con datos de estudiantes
- ✅ Soporte para plantillas en imagen (PNG/JPG) o HTML
- ✅ Generación de PDFs en dos modos:
  - Un solo PDF con todos los carnets
  - PDFs individuales por carnet (ZIP)
- ✅ Vista previa de datos antes de generar
- ✅ Interfaz moderna con Tailwind CSS

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
- jsPDF (generación de PDFs)
- xlsx (lectura de Excel)

## 📁 Estructura del Proyecto

```
/app
  /upload          - Página de carga de archivos
  /api/generate    - API para generar PDFs
/components        - Componentes reutilizables
/public
  /templates       - Plantillas de carnets
  /uploads         - Archivos temporales
```

## 📝 Uso

1. Accede a la página principal
2. Haz clic en "Comenzar"
3. Sube tu archivo Excel
4. Sube la plantilla del carnet
5. Selecciona el modo de generación
6. Haz clic en "Generar Carnets"

## ⚡ Próximas Mejoras

- [ ] Soporte para fotos en el Excel
- [ ] Editor de plantillas HTML en línea
- [ ] Generación de ZIP para múltiples PDFs
- [ ] Historial de generaciones
- [ ] Personalización de posición de campos
