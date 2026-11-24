import { db } from "hatchable";
import { cities } from "../render/latvia-cities.js";

export const access = "public";
export const methods = ["GET"];

export default async function locations(req, res) {
  const result = await db.query(
    "SELECT country, city, COUNT(*)::integer AS count FROM mm_public_listings " +
    "WHERE status = 'approved' AND country ~ '^[A-Z]{2,3}$' AND btrim(city) <> '' GROUP BY country, city"
  );
  const directory = cities.map(([city, local]) => ({country: "LV", city, local, count: 0}));
  const byName = new Map(directory.flatMap(row => [[row.city, row], [row.local, row]]));
  for (const row of result.rows) {
    const known = row.country === "LV" && byName.get(row.city);
    if (known) known.count += row.count;
    else directory.push(row);
  }
  res.json({locations: directory});
}
