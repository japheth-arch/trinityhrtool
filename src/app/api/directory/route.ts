import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { HOLIDAY_COUNTRY_LABELS, type HolidayCountry } from "@/types/database";

/**
 * Machine-callable staff directory for our other internal sites. Read-only,
 * active staff only, and a fixed set of non-sensitive fields — nothing else
 * from the profile leaves through here. Authenticated with a bearer secret
 * rather than a session, since the caller is a server, not a browser:
 *
 *   curl https://<host>/api/directory \
 *     -H "Authorization: Bearer $DIRECTORY_API_SECRET"
 *
 * The secret must stay server-side on the calling site; never ship it to a
 * browser.
 */
export async function GET(request: Request) {
  const secret = process.env.DIRECTORY_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "DIRECTORY_API_SECRET is not configured" },
      { status: 503 }
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  type Row = {
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    preferred_name: string | null;
    email: string;
    hire_date: string | null;
    holiday_country: string | null;
  };

  const admin = createAdminClient();
  let rows: Row[];
  try {
    rows = await fetchAllRows<Row>((from, to) =>
      admin
        .from("users")
        .select(
          "first_name, middle_name, last_name, preferred_name, email, hire_date, holiday_country"
        )
        .eq("is_active", true)
        .order("email")
        .range(from, to)
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Query failed" },
      { status: 500 }
    );
  }

  const users = rows.map((r) => ({
    first_name: r.first_name,
    middle_name: r.middle_name,
    last_name: r.last_name,
    preferred_name: r.preferred_name,
    email: r.email,
    start_date: r.hire_date,
    country_code: r.holiday_country,
    country: r.holiday_country
      ? HOLIDAY_COUNTRY_LABELS[r.holiday_country as HolidayCountry] ??
        r.holiday_country
      : null,
  }));

  return NextResponse.json(
    { count: users.length, users },
    { headers: { "Cache-Control": "no-store" } }
  );
}
