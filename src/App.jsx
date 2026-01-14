import { useEffect, useMemo, useState } from "react";

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/\s+/g, " ")
    .trim();
}

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 250);
  const [maxToShow, setMaxToShow] = useState(200);

  // Cargar catálogo ya convertido a JSON
  useEffect(() => {
    fetch("/catalogo.json")
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar catalogo.json");
        return r.json();
      })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error(e);
        setRows([]);
      });
  }, []);

  // Filtrar por DescripcionCIAN
  const results = useMemo(() => {
    const term = normalizeText(debouncedQ);
    if (!term) return [];
    return rows.filter((r) =>
      normalizeText(r.DescripcionCIAN).includes(term)
    );
  }, [debouncedQ, rows]);

  // Agrupar por DescripcionCIAN
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

  // Limitar render
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
      backgroundColor: "#faf9f7"
    }}>
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

      <div style={{
        backgroundColor: "#fefdfb",
        padding: "24px",
        borderRadius: "16px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "20px",
        marginBottom: "32px",
        border: "1px solid #e8e4df",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
      }}>
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
              backgroundColor: "#faf9f7",
              transition: "all 0.2s",
              fontFamily: "inherit",
              color: "#3a3a37"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#8b9d9e";
              e.target.style.backgroundColor = "#fefdfb";
              e.target.style.boxShadow = "0 0 0 3px rgba(139, 157, 158, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ddd8d1";
              e.target.style.backgroundColor = "#faf9f7";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

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
              backgroundColor: "#fefdfb",
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

      {debouncedQ.trim() && (
        <div style={{ marginBottom: "24px", padding: "16px 20px", backgroundColor: "#f0f4f3", borderRadius: "12px", border: "1px solid #dce5e2", fontSize: "1rem", color: "#496b6d", fontWeight: "600" }}>
          Encontradas <span style={{ fontSize: "1.2rem", color: "#3a3a37" }}>{results.length}</span> coincidencias
          {results.length > maxToShow && (
             <span style={{ display: "block", marginTop: "6px", fontSize: "0.9rem", color: "#a87c4f", fontWeight: "500" }}>
              Mostrando los primeros {groupedLimited.shown}
            </span>
          )}
        </div>
      )}

      <div>
        {groupedLimited.out.map((g) => (
          <div
            key={g.DescripcionCIAN}
            style={{
              backgroundColor: "#fefdfb",
              borderRadius: "14px",
              marginBottom: "28px",
              overflow: "hidden",
              border: "1px solid #e8e4df",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              transition: "all 0.2s"
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

            {g.items.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e8e4df", backgroundColor: "#faf9f7" }}>
                      <th style={{ padding: "16px 24px", color: "#525047", fontWeight: "700", width: "200px" }}>Actividad BMX</th>
                      <th style={{ padding: "16px 24px", color: "#525047", fontWeight: "700" }}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((r, idx) => (
                      <tr key={`${r.ActividadBMX}-${idx}`} style={{ borderBottom: idx === g.items.length - 1 ? "none" : "1px solid #f0ebe5", backgroundColor: idx % 2 === 0 ? "#fefdfb" : "#faf9f7", transition: "background-color 0.2s" }}>
                        <td style={{ padding: "16px 24px", fontFamily: "'Courier New', monospace", color: "#6b7970", fontWeight: "600", fontSize: "0.95rem" }}>
                          {r.ActividadBMX}
                        </td>
                        <td style={{ padding: "16px 24px", color: "#525047", lineHeight: "1.5" }}>{r.DescripcionBMX}</td>
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
                backgroundColor: "#faf9f7"
              }}>
                <p style={{ margin: "0 0 12px 0", fontSize: "1.05rem", fontWeight: "600", color: "#525047" }}>Sin actividades asignadas</p>
                <p style={{ margin: 0, fontSize: "0.95rem" }}>Esta categoría SCIAN no tiene correspondencias con actividades BMX registradas en el catálogo actual</p>
              </div>
            )}
          </div>
        ))}

        {debouncedQ.trim() && groupedLimited.out.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 40px",
            color: "#8a8680",
            fontSize: "1.15rem",
            backgroundColor: "#fefdfb",
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
