// Utility for exporting leads table data to CSV format
import { toast } from "sonner";

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLeadsToCSV(leads = [], columnsConfig = [], filename = "smoothsales_leads.csv") {
  if (!leads || leads.length === 0) {
    toast.error("No leads available to export.");
    return;
  }

  try {
    // 1. Determine headers
    const exportableCols = columnsConfig.filter((col) => col.id !== "select");
    const headers = exportableCols.map((c) => `"${(c.header || c.id).replace(/"/g, '""')}"`);

    // 2. Build CSV rows
    const rows = leads.map((lead) => {
      return exportableCols
        .map((col) => {
          let val = lead[col.accessorKey];

          if (val === null || val === undefined) {
            val = "";
          } else if (typeof val === "object") {
            if (val.name) {
              val = val.name; // owner object
            } else if (val.stage) {
              val = val.stage; // deal stage object
            } else if (Array.isArray(val)) {
              val = val.join(", "); // tags array
            } else {
              val = JSON.stringify(val);
            }
          }

          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        })
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${leads.length} leads to CSV`, {
      description: `Saved as ${filename}`,
    });
  } catch (err) {
    console.error("Export error:", err);
    toast.error("Failed to generate CSV export file.");
  }
}
