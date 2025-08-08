import { clerkClient } from "@clerk/nextjs/server";

// GET /api/admin/users?query=&sort=&order=&limit=&offset=
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const sort = (searchParams.get("sort") || "registration_date").toLowerCase();
    const order = (searchParams.get("order") || "desc").toLowerCase(); // 'asc' | 'desc'
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    console.log("query", query);
    console.log("sort", sort);
    console.log("order", order);
    console.log("limit", limit);
    console.log("offset", offset);

    // Clerk supports orderBy on a subset of fields. Map our sort keys.
    let orderBy;
    if (sort === "registration_date") {
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    } else if (sort === "name") {
      // No reliable server-side order for full name; fetch then sort in-memory
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    } else if (sort === "dob") {
      // No server-side order for birthday; fallback
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    } else {
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    }

    const clerk = await clerkClient();
    const { data, totalCount } = await clerk.users.getUserList({
      limit,
      offset,
      ...(query ? { query } : {}),
      orderBy,
    });
    console.log("data", data);

    const users = data.map((u) => {
      const primaryEmail =
        u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
        u.emailAddresses?.[0]?.emailAddress ||
        null;
      const birthday = u.birthday /* YYYY-MM-DD */ || u.publicMetadata?.dob || null;
      return {
        id: u.id,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        username: u.username || "",
        email: primaryEmail,
        imageUrl: u.imageUrl || null,
        createdAt: u.createdAt,
        birthday,
      };
    });

    // In-memory sort when needed (name, dob)
    if (sort === "name") {
      users.sort((a, b) => {
        const an = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
        const bn = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
        return order === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      });
    } else if (sort === "dob") {
      users.sort((a, b) => {
        const av = a.birthday ? new Date(a.birthday).getTime() : 0;
        const bv = b.birthday ? new Date(b.birthday).getTime() : 0;
        return order === "asc" ? av - bv : bv - av;
      });
    }
    console.log("users", users);

    return new Response(JSON.stringify({ users, totalCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
