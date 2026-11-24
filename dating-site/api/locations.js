import { db } from "hatchable";

export const access = "public";
export const methods = ["GET"];

export default async function locations(req, res) {
  const result = await db.query(
    "SELECT DISTINCT country, city FROM mm_public_listings " +
    "WHERE status = 'approved' AND country ~ '^[A-Z]{2,3}$' AND btrim(city) <> ''"
  );
  res.json({locations: result.rows});
}
