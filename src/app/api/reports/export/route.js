import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, title, headers = [], rows = [] } = body; // generic payload for export

    if (type === "csv") {
      const csv = [
        headers.join(","),
        ...rows.map((r) => r.map((c) => (c ?? "").toString().replace(/\"/g, '"')).join(",")),
      ].join("\n");
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
      const doc = new jsPDF();

      // Set up colors
      const primaryColor = [41, 128, 185]; // Blue
      const headerBgColor = [52, 73, 94]; // Dark gray
      const alternateRowColor = [236, 240, 241]; // Light gray
      const textColor = [44, 62, 80]; // Dark blue-gray

      // Header section with background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 35, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(title || "Report", 105, 22, { align: "center" });

      // Date and time
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleString();
      doc.text(`Generated on: ${currentDate}`, 105, 30, { align: "center" });

      // Reset text color for content
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      let yPosition = 50;

      if (headers.length && rows.length) {
        // Calculate column widths based on content
        const pageWidth = 210; // A4 width in mm
        const margin = 15;
        const tableWidth = pageWidth - margin * 2;
        const colWidth = tableWidth / headers.length;

        // Table header
        doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
        doc.rect(margin, yPosition, tableWidth, 10, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        headers.forEach((header, index) => {
          const xPos = margin + index * colWidth + 2;
          doc.text(header.toString(), xPos, yPosition + 7);
        });

        yPosition += 10;
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont("helvetica", "normal");

        // Table rows
        rows.forEach((row, rowIndex) => {
          // Alternate row colors
          if (rowIndex % 2 === 0) {
            doc.setFillColor(alternateRowColor[0], alternateRowColor[1], alternateRowColor[2]);
            doc.rect(margin, yPosition, tableWidth, 8, "F");
          }

          row.forEach((cell, colIndex) => {
            const xPos = margin + colIndex * colWidth + 2;
            const cellText = (cell ?? "").toString();

            // Truncate text if too long for column
            const maxLength = Math.floor(colWidth / 2.5); // Approximate chars per mm
            const displayText = cellText.length > maxLength ? cellText.substring(0, maxLength - 3) + "..." : cellText;

            doc.text(displayText, xPos, yPosition + 6);
          });

          yPosition += 8;

          // Add new page if content exceeds page height
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
        });

        // Add border around the table
        doc.setDrawColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
        doc.setLineWidth(0.5);
        doc.rect(margin, 50, tableWidth, (rows.length + 1) * 8 + 2);

        // Add vertical lines for columns
        for (let i = 1; i < headers.length; i++) {
          const xPos = margin + i * colWidth;
          doc.line(xPos, 50, xPos, 50 + (rows.length + 1) * 8 + 2);
        }
      } else {
        // Fallback for no data
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text("No data available", 105, yPosition, { align: "center" });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      }

      const buffer = Buffer.from(doc.output("arraybuffer"));
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
