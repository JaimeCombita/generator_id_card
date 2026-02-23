# Plantilla de Carnet - Sistema de Generación de Carnets

Esta carpeta contiene la plantilla por defecto del carnet estudiantil.

## Archivos incluidos:

- **carnet-horizontal.html** - Plantilla HTML del carnet (8.5cm x 5.5cm)
- **logo_colegio.jpg** - Logo placeholder del colegio (opcional)
- **logo_secretaria.jpg** - Logo placeholder de la Secretaría de Educación (opcional)

## Dimensiones del carnet:

- **Ancho**: 8.5 cm
- **Alto**: 5.5 cm
- **Espacio para foto**: 3 cm x 4 cm

## Campos dinámicos:

La plantilla usa los siguientes marcadores que serán reemplazados con los datos del Excel:

- `{{NOMBRES}}` - Nombre completo del estudiante
- `{{CURSO}}` - Curso o grado
- `{{IDENTIFICACION}}` - Número de identificación

## Nueva funcionalidad de personalización:

El sistema ahora permite personalizar la plantilla por defecto a través de la interfaz web:

1. **Nombre del Colegio**: Se puede cambiar el nombre que aparece en el carnet
2. **Logo del Colegio**: Puedes subir tu propio logo que reemplazará el logo por defecto
3. **Logo de Secretaría**: 
   - Puedes incluir/excluir el logo de la Secretaría de Educación de Bogotá
   - Si prefieres no incluirlo, puedes subir el logo de otra alcaldía
4. **Plantilla personalizada**: También puedes cargar tu propia plantilla HTML completa

## Notas:

- Los logos se convierten automáticamente a base64 para su inclusión en el PDF
- Si no subes logos personalizados, se usarán los logos por defecto (si existen)
- Los cambios se aplican en tiempo real durante la generación de carnets
