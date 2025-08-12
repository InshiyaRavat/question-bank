import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to stream PDF
function streamPdf(doc) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, title, headers = [], rows = [] } = body; // generic payload for export

    if (type === "csv") {
      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => (c ?? "").toString().replace(/\"/g, '"')).join(","))].join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${(title || "report").replace(/\s+/g, "_")}.csv"`,
        },
      });
    }

    if (type === "xlsx") {
      const wb = XLSX.utils.book_new();
      const aoa = headers.length ? [headers, ...rows] : rows;
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${(title || "report").replace(/\s+/g, "_")}.xlsx"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    if (type === "pdf") {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      doc.fontSize(18).text(title || "Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(10);

      // Table headers
      if (headers.length) {
        doc.text(headers.join("  |  "));
        doc.moveDown(0.5);
      }
      // Rows
      for (const row of rows) {
        doc.text(row.map((c) => (c ?? "").toString()).join("  |  "));
      }

      const buffer = await streamPdf(doc);
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${(title || "report").replace(/\s+/g, "_")}.pdf"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported export type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


