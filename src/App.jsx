import { useEffect, useMemo, useState } from "react";
import catalogoData from "../public/catalogo.json";

// Agregar estilos de animación
const styles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

// Inyectar estilos en el documento
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

/**
 * Normaliza texto para búsquedas: convierte a minúsculas, elimina acentos y espacios extras
 * @param {string} s - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Hook personalizado que debouncea un valor para evitar actualizaciones excesivas
 * @param {any} value - Valor a desbouncer
 * @param {number} delay - Tiempo de espera en milisegundos (default: 250ms)
 * @returns {any} Valor debounceado
 */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

/**
 * Componente principal del catálogo SCIAN → BMX
 * Permite buscar y visualizar correspondencias entre clasificaciones SCIAN y BMX
 */
export default function App() {
  // Estado: todos los registros del catálogo
  const [rows, setRows] = useState([]);
  // Estado: término de búsqueda actual
  const [q, setQ] = useState("");
  // Término de búsqueda con debounce para optimizar el renderizado
  const debouncedQ = useDebouncedValue(q, 250);
  // Estado: límite de resultados a mostrar
  const [maxToShow, setMaxToShow] = useState(200);
  // Estado: item que se copió recientemente (para mostrar feedback visual)
  const [copiedId, setCopiedId] = useState(null);
  // Estado: indica si está procesando la búsqueda
  const [isSearching, setIsSearching] = useState(false);

  // Cargar catálogo ya convertido a JSON al montar el componente
  useEffect(() => {
    try {
      const data = catalogoData;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando catálogo:", e);
      setRows([]);
    }
  }, []);

  /**
   * Copia el valor numérico de ActividadBMX al portapapeles
   * @param {object} item - Elemento con ActividadBMX
   */
  const copyToClipboard = async (item) => {
    try {
      await navigator.clipboard.writeText(item.ActividadBMX);
      
      // Mostrar feedback visual temporal
      setCopiedId(item.ActividadBMX);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  // Filtrar registros por DescripcionCIAN según el término de búsqueda
  const results = useMemo(() => {
    const term = normalizeText(debouncedQ);
    if (!term) {
      setIsSearching(false);
      return [];
    }
    setIsSearching(true);
    const filtered = rows.filter((r) =>
      normalizeText(r.DescripcionCIAN).includes(term)
    );
    setIsSearching(false);
    return filtered;
  }, [debouncedQ, rows]);

  // Agrupar resultados por DescripcionCIAN para mejor visualización
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of results) {
      const key = r.DescripcionCIAN || "(Sin DescripcionCIAN)";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return Array.from(map.entries()).map(([DescripcionCIAN, items]) => ({
      DescripcionCIAN,
      items,
    }));
  }, [results]);

  // Limitar la cantidad de resultados renderizados para optimizar performance
  const groupedLimited = useMemo(() => {
    let count = 0;
    const out = [];
    for (const g of grouped) {
      const items = [];
      for (const it of g.items) {
        if (count >= maxToShow) break;
        items.push(it);
        count++;
      }
      if (items.length) out.push({ ...g, items });
      if (count >= maxToShow) break;
    }
    return { out, shown: count };
  }, [grouped, maxToShow]);

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "24px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#525047",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5"
    }}>
      {/* Encabezado con título y contador de registros */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          margin: "0 0 8px 0",
          fontSize: "2.5rem",
          color: "#3a3a37",
          fontWeight: "800",
          letterSpacing: "-0.02em"
        }}>
          Catálogo SCIAN → BMX
        </h1>
        <p style={{ margin: 0, color: "#8a8680", fontSize: "1rem", fontWeight: "500" }}>
          {rows.length.toLocaleString()} registros disponibles
        </p>
      </div>

      {/* Panel de búsqueda y configuración */}
      <div style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "20px",
        marginBottom: "32px",
        border: "1px solid #e8e4df",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
      }}>
        {/* Input de búsqueda */}
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "0.95rem", fontWeight: "700", color: "#3a3a37" }}>
            Buscar en el catálogo
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej: soya, semillas, legumbres, granos..."
            autoFocus
            style={{
              width: "100%",
              padding: "14px 18px",
              fontSize: "1.05rem",
              borderRadius: "10px",
              border: "1px solid #ddd8d1",
              outline: "none",
              backgroundColor: "#f5f5f5",
              transition: "all 0.2s",
              fontFamily: "inherit",
              color: "#3a3a37"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#8b9d9e";
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.boxShadow = "0 0 0 3px rgba(139, 157, 158, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd8d1";
              e.target.style.backgroundColor = "#f5f5f5";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Selector de límite de resultados */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <select
            value={maxToShow}
            onChange={(e) => setMaxToShow(Number(e.target.value))}
            style={{
              padding: "14px 16px",
              fontSize: "0.95rem",
              fontWeight: "600",
              borderRadius: "10px",
              border: "1px solid #ddd8d1",
              backgroundColor: "#ffffff",
              outline: "none",
              cursor: "pointer",
              minWidth: "180px",
              transition: "all 0.2s",
              fontFamily: "inherit",
              color: "#3a3a37"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#8b9d9e";
              e.target.style.boxShadow = "0 0 0 3px rgba(139, 157, 158, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd8d1";
              e.target.style.boxShadow = "none";
            }}
          >
            <option value={100}>100 resultados</option>
            <option value={200}>200 resultados</option>
            <option value={500}>500 resultados</option>
            <option value={1000}>1000 resultados</option>
          </select>
        </div>
      </div>

      {/* Información de resultados encontrados */}
      {debouncedQ.trim() && (
        <div style={{ marginBottom: "24px", padding: "16px 20px", backgroundColor: "#f0f4f3", borderRadius: "12px", border: "1px solid #dce5e2", fontSize: "1rem", color: "#496b6d", fontWeight: "600", animation: "fadeIn 0.3s ease-out" }}>
          {isSearching ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "16px",
                height: "16px",
                border: "2px solid #dce5e2",
                borderTop: "2px solid #496b6d",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite"
              }} />
              Buscando...
            </div>
          ) : (
            <>
              Encontradas <span style={{ fontSize: "1.2rem", color: "#3a3a37" }}>{results.length}</span> coincidencias
              {results.length > maxToShow && (
                <span style={{ display: "block", marginTop: "6px", fontSize: "0.9rem", color: "#a87c4f", fontWeight: "500" }}>
                  Mostrando los primeros {groupedLimited.shown}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Contenedor de resultados agrupados */}
      <div>
        {/* Mensaje de notificación flotante */}
        {copiedId && (
          <div style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#4caf50",
            color: "#ffffff",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            fontSize: "1rem",
            fontWeight: "600",
            zIndex: "1000",
            animation: "slideIn 0.3s ease-out"
          }}>
            Id copiado al portapapeles
          </div>
        )}

        {/* Indicador de carga general */}
        {isSearching && groupedLimited.out.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 40px",
            color: "#8a8680",
            fontSize: "1.15rem",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e8e4df",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            animation: "fadeIn 0.3s ease-out"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: "3px solid #e8e4df",
              borderTop: "3px solid #8a8680",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite"
            }} />
            Filtrando resultados...
          </div>
        )}
        {/* Mapear cada grupo de DescripcionCIAN */}
        {groupedLimited.out.map((g, groupIdx) => (
          <div
            key={g.DescripcionCIAN}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              marginBottom: "28px",
              overflow: "hidden",
              border: "1px solid #e8e4df",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              transition: "all 0.2s",
              animation: `slideIn 0.4s ease-out ${groupIdx * 0.05}s both`
            }}
          >
            <div style={{
              padding: "18px 24px",
              backgroundColor: "#f5f4f2",
              borderBottom: "1px solid #e8e4df",
              fontWeight: "800",
              color: "#3a3a37",
              fontSize: "1.15rem",
              letterSpacing: "-0.01em"
            }}>
              {g.DescripcionCIAN}
            </div>

            {/* Mostrar tabla si hay items, sino mostrar mensaje de categoría sin datos */}
            {g.items.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e8e4df", backgroundColor: "#f5f5f5" }}>
                      <th style={{ padding: "16px 24px", color: "#525047", fontWeight: "700", width: "200px" }}>Actividad BMXID</th>
                      <th style={{ padding: "16px 24px", color: "#525047", fontWeight: "700" }}>Descripción</th>
                      <th style={{ padding: "16px 24px", color: "#525047", fontWeight: "700", width: "50px", textAlign: "center" }}>Copiar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((r, idx) => (
                      <tr key={`${r.ActividadBMX}-${idx}`} style={{ borderBottom: idx === g.items.length - 1 ? "none" : "1px solid #f0ebe5", backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f5f5f5", transition: "background-color 0.2s", animation: `fadeIn 0.3s ease-out ${idx * 0.02}s both` }}>
                        <td style={{ padding: "16px 24px", fontFamily: "'Courier New', monospace", color: "#6b7970", fontWeight: "600", fontSize: "0.95rem" }}>
                          {r.ActividadBMX}
                        </td>
                        <td style={{ padding: "16px 24px", color: "#525047", lineHeight: "1.5" }}>{r.DescripcionBMX}</td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <button
                            onClick={() => copyToClipboard(r)}
                            title="Copiar al portapapeles"
                            style={{
                              background: copiedId === r.ActividadBMX ? "#4caf50" : "#f0ebe5",
                              border: copiedId === r.ActividadBMX ? "1px solid #45a049" : "1px solid #ddd8d1",
                              color: copiedId === r.ActividadBMX ? "#ffffff" : "#525047",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100px",
                              height: "40px",
                              margin: "0 auto"
                            }}
                          >
                            {copiedId === r.ActividadBMX ? "✓ Copiado" : "Copiar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "#8a8680",
                fontSize: "1rem",
                lineHeight: "1.8",
                backgroundColor: "#f5f5f5"
              }}>
                <p style={{ margin: "0 0 12px 0", fontSize: "1.05rem", fontWeight: "600", color: "#525047" }}>Sin actividades asignadas</p>
                <p style={{ margin: 0, fontSize: "0.95rem" }}>Esta categoría SCIAN no tiene correspondencias con actividades BMX registradas en el catálogo actual</p>
              </div>
            )}
          </div>
        ))}

        {/* Mensaje cuando no se encuentra ningún resultado */}
        {debouncedQ.trim() && groupedLimited.out.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 40px",
            color: "#8a8680",
            fontSize: "1.15rem",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px dashed #ddd8d1"
          }}>
            No se encontraron resultados para "<b>{debouncedQ}</b>"
          </div>
        )}
      </div>
    </div>
  );
}
