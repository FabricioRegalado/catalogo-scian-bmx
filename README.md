# Catálogo SCIAN → BMX

Herramienta web interactiva para consultar la clasificación de actividades económicas del SCIAN y sus correspondencias con las clasificaciones BMX.

## Características

- Búsqueda rápida en tiempo real con normalización de texto (acentos, espacios)
- Debounce optimizado para evitar sobre-renderizados
- Interfaz limpia y natural con paleta de colores sofisticada
- Datos actualizados desde CSV convertido a JSON
- Responsive y accesible

## Instalación

```bash
git clone https://github.com/tuUsuario/catalogo-scian-bmx.git
cd catalogo-scian-bmx
npm install
```

## Desarrollo

```bash
npm run dev
```

Se abrirá en `http://localhost:5173`

## Build

```bash
npm run build
```

Genera los archivos optimizados en `dist/`

## Deploy en GitHub Pages

```bash
npm run deploy
```

Tu sitio estará disponible en: `https://tuUsuario.github.io/catalogo-scian-bmx/`

## Comandos disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run build:catalogo` - Convierte CSV a JSON
- `npm run deploy` - Deploy a GitHub Pages
- `npm run preview` - Previsualiza el build
- `npm run lint` - Verifica el código

## Estructura

```
src/
├── App.jsx           # Componente principal
├── App.css          # Estilos
├── main.jsx         # Punto de entrada
└── index.css        # Estilos globales

data/
└── catalogo.csv     # Datos origen

scripts/
└── csv-to-json.js   # Conversor CSV → JSON

public/
└── catalogo.json    # Datos compilados
```

## Stack

- React 19 - UI
- Vite - Build tool
- PapaParse - CSV parsing
- ESLint - Linting

## Licencia

MIT
