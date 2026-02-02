export const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
        alert('No hay datos para exportar');
        return;
    }

    // Generate CSV content
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            let cell = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof cell === 'string') {
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
            }
            return cell;
        }).join(','))
    ].join('\n');

    // Create Blob and download link
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
