# Washouse - Sistema de Control Operativo

Sistema de gestión para lavanderías con soporte para múltiples sucursales, control de inventarios, gestión de turnos y punto de venta.

## Características Principales

*   **Punto de Venta (POS)**: Generación de tickets, cálculo de cambio y reportes de ventas.
*   **Gestión de Turnos**: Apertura y cierre de caja con control de efectivo.
*   **Multi-Sucursal**: Administración centralizada de inventarios y reportes por sucursal.
*   **Control de Servicios**:
    *   **Autoservicio**: Control de tiempos de máquinas (Lavadoras/Secadoras).
    *   **Encargo**: Recepción de prendas, etiquetado y seguimiento (Kanban).
*   **Inventario**: Control de existencias de productos (jabón, suavizante, etc.).
*   **Reportes**: Métricas financieras, reporte de ingresos y exportación a PDF/Excel.

## Requisitos

*   Node.js (v18 o superior)
*   Navegador Web Moderno (Chrome, Edge, Firefox)

## Instalación y Uso

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Iniciar modo desarrollo**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

3.  **Construir para producción**:
    ```bash
    npm run build
    ```
    Los archivos generados se guardarán en la carpeta `dist`.

## Credenciales (Demo)

*   **Admin PIN**: `1234` (Para acceso al Dashboard Administrativo)
*   **Operador**: No requiere contraseña, solo nombre al iniciar turno.

## Tecnologías

*   React + Vite
*   Tailwind CSS
*   Lucide Icons
*   Recharts (Gráficos)
