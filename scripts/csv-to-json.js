import fs from "fs";
import path from "path";
import Papa from "papaparse";

const root = process.cwd();

const csvPath = path.join(root, "data", "catalogo.csv");
const jsonOutPath = path.join(root, "public", "catalogo.json");

if (!fs.existsSync(csvPath)) {
  console.error("No se encontró:", csvPath);
  process.exit(1);
}

const csvText = fs.readFileSync(csvPath, "utf8");

const parsed = Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true,
});

if (parsed.errors.length) {
  console.error("Error al parsear CSV:", parsed.errors);
  process.exit(1);
}

const clean = parsed.data
  .map((r) => ({
    DescripcionCIAN: (r.DescripcionCIAN || "").trim(),
    ActividadBMX: String(r.ActividadBMXID ?? r.ActividadBMX ?? "").trim(),
    DescripcionBMX: (r.DescripcionBMX || "").trim(),
  }))
  .filter((r) => r.DescripcionCIAN);



fs.writeFileSync(jsonOutPath, JSON.stringify(clean, null, 2), "utf8");

console.log(`catalogo.json generado (${clean.length} filas)`);
