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
  // Estado: tema (dark/light)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

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

  // Guardar preferencia de tema en localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
    document.body.style.transition = 'background-color 0.3s ease';
  }, [isDarkMode]);

  // Función para alternar el tema
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Colores del tema
  const theme = {
    bg: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    cardBg: isDarkMode ? '#2d2d2d' : '#ffffff',
    text: isDarkMode ? '#e0e0e0' : '#3a3a37',
    textSecondary: isDarkMode ? '#b0b0b0' : '#525047',
    textMuted: isDarkMode ? '#808080' : '#8a8680',
    border: isDarkMode ? '#404040' : '#e8e4df',
    inputBg: isDarkMode ? '#242424' : '#f5f5f5',
    inputBorder: isDarkMode ? '#404040' : '#ddd8d1',
    inputFocusBorder: isDarkMode ? '#6b9b9d' : '#8b9d9e',
    headerBg: isDarkMode ? '#242424' : '#f5f4f2',
    tableHeaderBg: isDarkMode ? '#242424' : '#f5f5f5',
    tableRowEven: isDarkMode ? '#2d2d2d' : '#ffffff',
    tableRowOdd: isDarkMode ? '#333333' : '#f5f5f5',
    tableRowBorder: isDarkMode ? '#404040' : '#f0ebe5',
    buttonBg: isDarkMode ? '#404040' : '#f0ebe5',
    buttonBorder: isDarkMode ? '#505050' : '#ddd8d1',
    buttonText: isDarkMode ? '#e0e0e0' : '#525047',
    infoBg: isDarkMode ? '#2a3a38' : '#f0f4f3',
    infoBorder: isDarkMode ? '#3a4a48' : '#dce5e2',
    infoText: isDarkMode ? '#8fb5b7' : '#496b6d',
  };

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
      color: theme.textSecondary,
      minHeight: "100vh",
      backgroundColor: theme.bg,
      transition: "background-color 0.3s ease"
    }}>
      {/* Encabezado con título, contador de registros y switch de tema */}
      <div style={{ 
        marginBottom: "32px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div>
          <h1 style={{
            margin: "0 0 8px 0",
            fontSize: "2.5rem",
            color: theme.text,
            fontWeight: "800",
            letterSpacing: "-0.02em",
            transition: "color 0.3s ease"
          }}>
            Catálogo SCIAN → BMX
          </h1>
          <p style={{ margin: 0, color: theme.textMuted, fontSize: "1rem", fontWeight: "500", transition: "color 0.3s ease" }}>
            {rows.length.toLocaleString()} registros disponibles
          </p>
        </div>
        
        {/* Switch de modo claro/oscuro estilo iOS */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.9rem", color: theme.textMuted, fontWeight: "500", transition: "color 0.3s ease" }}>
            {isDarkMode ? "Oscuro" : "Claro"}
          </span>
          <button
            onClick={toggleTheme}
            title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            style={{
              position: "relative",
              width: "58px",
              height: "32px",
              borderRadius: "16px",
              border: "none",
              cursor: "pointer",
              background: isDarkMode ? "#4cd964" : "#e5e5ea",
              transition: "background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              padding: 0,
              outline: "none"
            }}
          >
            <div style={{
              position: "absolute",
              top: "2px",
              left: isDarkMode ? "28px" : "2px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }} />
          </button>
        </div>
      </div>

      {/* Panel de búsqueda y configuración */}
      <div style={{
        backgroundColor: theme.cardBg,
        padding: "24px",
        borderRadius: "16px",
        display: "grid",
        gridTemplateColumns: window.innerWidth > 768 ? "1fr auto" : "1fr",
        gap: "20px",
        marginBottom: "32px",
        border: `1px solid ${theme.border}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s ease"
      }}>
        {/* Input de búsqueda */}
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "0.95rem", fontWeight: "700", color: theme.text, transition: "color 0.3s ease" }}>
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
              border: `1px solid ${theme.inputBorder}`,
              outline: "none",
              backgroundColor: theme.inputBg,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              fontFamily: "inherit",
              color: theme.text
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.inputFocusBorder;
              e.target.style.backgroundColor = theme.cardBg;
              e.target.style.boxShadow = `0 0 0 3px ${isDarkMode ? 'rgba(107, 155, 157, 0.15)' : 'rgba(139, 157, 158, 0.08)'}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.inputBorder;
              e.target.style.backgroundColor = theme.inputBg;
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
              border: `1px solid ${theme.inputBorder}`,
              backgroundColor: theme.cardBg,
              outline: "none",
              cursor: "pointer",
              minWidth: "180px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              fontFamily: "inherit",
              color: theme.text
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.inputFocusBorder;
              e.target.style.boxShadow = `0 0 0 3px ${isDarkMode ? 'rgba(107, 155, 157, 0.15)' : 'rgba(139, 157, 158, 0.08)'}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.inputBorder;
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

      {/* Pantalla inicial cuando no hay búsqueda */}
      {!debouncedQ.trim() && rows.length > 0 && (
        <div style={{
          textAlign: "center",
          padding: "80px 40px",
          backgroundColor: theme.cardBg,
          borderRadius: "14px",
          border: `1px solid ${theme.border}`,
          transition: "all 0.3s ease"
        }}>
          <h2 style={{
            margin: "0 0 12px 0",
            fontSize: "1.5rem",
            color: theme.text,
            fontWeight: "700",
            transition: "color 0.3s ease"
          }}>Buscar en el catálogo</h2>
          <p style={{
            margin: 0,
            color: theme.textMuted,
            fontSize: "1rem",
            transition: "color 0.3s ease"
          }}>Ingresa una palabra clave para filtrar los resultados</p>
        </div>
      )}

      {/* Información de resultados encontrados */}
      {debouncedQ.trim() && (
        <div style={{ marginBottom: "24px", padding: "16px 20px", backgroundColor: theme.infoBg, borderRadius: "12px", border: `1px solid ${theme.infoBorder}`, fontSize: "1rem", color: theme.infoText, fontWeight: "600", animation: "fadeIn 0.3s ease-out", transition: "all 0.3s ease" }}>
          {isSearching ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "16px",
                height: "16px",
                border: `2px solid ${theme.infoBorder}`,
                borderTop: `2px solid ${theme.infoText}`,
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite"
              }} />
              Buscando...
            </div>
          ) : (
            <>
              Encontradas <span style={{ fontSize: "1.2rem", color: theme.text, transition: "color 0.3s ease" }}>{results.length}</span> coincidencias
              {results.length > maxToShow && (
                <span style={{ display: "block", marginTop: "6px", fontSize: "0.9rem", color: isDarkMode ? "#c09068" : "#a87c4f", fontWeight: "500", transition: "color 0.3s ease" }}>
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
            color: theme.textMuted,
            fontSize: "1.15rem",
            backgroundColor: theme.cardBg,
            borderRadius: "14px",
            border: `1px solid ${theme.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            animation: "fadeIn 0.3s ease-out",
            transition: "all 0.3s ease"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: `3px solid ${theme.border}`,
              borderTop: `3px solid ${theme.textMuted}`,
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
              backgroundColor: theme.cardBg,
              borderRadius: "14px",
              marginBottom: "28px",
              overflow: "hidden",
              border: `1px solid ${theme.border}`,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              transition: "all 0.3s ease",
              animation: `slideIn 0.4s ease-out ${groupIdx * 0.05}s both`
            }}
          >
            <div style={{
              padding: "18px 24px",
              backgroundColor: theme.headerBg,
              borderBottom: `1px solid ${theme.border}`,
              fontWeight: "800",
              color: theme.text,
              fontSize: "1.15rem",
              letterSpacing: "-0.01em",
              transition: "all 0.3s ease"
            }}>
              {g.DescripcionCIAN}
            </div>

            {/* Mostrar tabla si hay items, sino mostrar mensaje de categoría sin datos */}
            {g.items.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.tableHeaderBg, transition: "all 0.3s ease" }}>
                      <th style={{ padding: "16px 24px", color: theme.textSecondary, fontWeight: "700", width: "200px", transition: "color 0.3s ease" }}>Actividad BMXID</th>
                      <th style={{ padding: "16px 24px", color: theme.textSecondary, fontWeight: "700", transition: "color 0.3s ease" }}>Descripción</th>
                      <th style={{ padding: "16px 24px", color: theme.textSecondary, fontWeight: "700", width: "50px", textAlign: "center", transition: "color 0.3s ease" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((r, idx) => (
                      <tr 
                        key={`${r.ActividadBMX}-${idx}`} 
                        style={{ 
                          borderBottom: idx === g.items.length - 1 ? "none" : `1px solid ${theme.tableRowBorder}`, 
                          backgroundColor: idx % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd, 
                          transition: "all 0.3s ease", 
                          animation: `fadeIn 0.3s ease-out ${idx * 0.02}s both`,
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f4f3';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = idx % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd;
                        }}
                      >
                        <td style={{ padding: "16px 24px", fontFamily: "'Courier New', monospace", color: isDarkMode ? "#90cca8" : "#6b7970", fontWeight: "600", fontSize: "0.95rem", transition: "color 0.3s ease" }}>
                          {r.ActividadBMX}
                        </td>
                        <td style={{ padding: "16px 24px", color: theme.textSecondary, lineHeight: "1.5", transition: "color 0.3s ease" }}>{r.DescripcionBMX}</td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <button
                            onClick={() => copyToClipboard(r)}
                            title="Copiar al portapapeles"
                            style={{
                              background: copiedId === r.ActividadBMX ? "#4caf50" : theme.buttonBg,
                              border: copiedId === r.ActividadBMX ? "1px solid #45a049" : `1px solid ${theme.buttonBorder}`,
                              color: copiedId === r.ActividadBMX ? "#ffffff" : theme.buttonText,
                              padding: "8px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100px",
                              height: "40px",
                              margin: "0 auto"
                            }}
                            onMouseEnter={(e) => {
                              if (copiedId !== r.ActividadBMX) {
                                e.currentTarget.style.transform = "scale(1.05)";
                                e.currentTarget.style.backgroundColor = isDarkMode ? "#505050" : "#e0dbd5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.backgroundColor = copiedId === r.ActividadBMX ? "#4caf50" : theme.buttonBg;
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
                color: theme.textMuted,
                fontSize: "1rem",
                lineHeight: "1.8",
                backgroundColor: theme.tableHeaderBg,
                transition: "all 0.3s ease"
              }}>
                <p style={{ margin: "0 0 12px 0", fontSize: "1.05rem", fontWeight: "600", color: theme.textSecondary, transition: "color 0.3s ease" }}>Sin actividades asignadas</p>
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
            color: theme.textMuted,
            fontSize: "1.15rem",
            backgroundColor: theme.cardBg,
            borderRadius: "14px",
            border: `1px dashed ${theme.border}`,
            transition: "all 0.3s ease"
          }}>
            No se encontraron resultados para "<b>{debouncedQ}</b>"
          </div>
        )}
      </div>
    </div>
  );
}
