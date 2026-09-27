# Manuales de usuario

Los manuales viven dentro de la app, cada uno en su área:

| Manual | Dirección | Para quién |
|---|---|---|
| Mostrador | [washouse.app/sucursal/manual](https://www.washouse.app/sucursal/manual) | Quien atiende la sucursal. Se puede leer sin abrir turno |
| Administración | [washouse.app/admin/manual](https://www.washouse.app/admin/manual) | Administradores (requiere PIN de admin) |

## Cómo se editan

- **Textos:** `src/data/manuals/sucursal.js` y `src/data/manuals/admin.js`. Son datos, no código de interfaz: secciones con bloques de tipo `p`, `steps`, `list`, `img`, `note` y `table`. `**texto**` se muestra en negritas.
- **Diseño:** `src/components/manual/ManualView.jsx`, compartido por los dos manuales.
- **Capturas:** `public/manual/sucursal/` y `public/manual/admin/`. Cuando cambie una pantalla, se regeneran con datos de demostración (sin tocar Supabase ni exponer clientes):

  ```bash
  npm run dev -- --port 5180 --strictPort   # en otra terminal
  node scripts/capturas-manual.mjs          # los dos manuales
  node scripts/capturas-manual.mjs admin    # solo uno
  ```
