<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} — Webfocus DMS</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            color: #1e293b;
            background: #fff;
            padding: 32px 40px;
        }

        /* ── Header ── */
        .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 14px;
            margin-bottom: 20px;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .brand-logo {
            width: 36px; height: 36px;
            background: #6366f1;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-weight: 700; font-size: 14px;
        }
        .brand-name { font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2; }
        .brand-sub  { font-size: 10px; color: #64748b; margin-top: 1px; }
        .report-title { text-align: right; }
        .report-title h1 { font-size: 16px; font-weight: 700; color: #0f172a; }
        .report-title p  { font-size: 10px; color: #64748b; margin-top: 3px; }

        /* ── Meta strip ── */
        .meta-strip {
            display: flex;
            gap: 24px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 16px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .meta-item label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
        .meta-item span  { font-size: 11px; font-weight: 600; color: #334155; }

        /* ── Summary bar ── */
        .summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }
        .summary-label { font-size: 11px; font-weight: 700; color: #0f172a; }
        .summary-count {
            background: #eef2ff; color: #4f46e5;
            border-radius: 4px; padding: 2px 8px;
            font-size: 10px; font-weight: 700;
        }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead tr { background: #f1f5f9; }
        th {
            padding: 8px 12px;
            text-align: left;
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: middle;
        }
        tbody tr:nth-child(even) td { background: #fafafa; }
        tbody tr:last-child td { border-bottom: none; }

        /* ── Footer ── */
        .print-footer {
            margin-top: 28px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
        }

        /* ── Print-only rules ── */
        @media print {
            body { padding: 20px 24px; }
            .no-print { display: none !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
        }

        /* ── Screen-only print button ── */
        .print-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 20px;
            background: #6366f1;
            color: #fff;
            border: none;
            border-radius: 7px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .print-btn:hover { background: #4f46e5; }
        .close-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: #f8fafc;
            color: #475569;
            border: 1px solid #e2e8f0;
            border-radius: 7px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 20px;
            margin-left: 8px;
        }
    </style>
</head>
<body>

    {{-- Screen-only action buttons --}}
    <div class="no-print" style="margin-bottom: 16px;">
        <button class="print-btn" onclick="window.print()">
            🖨 Print / Save as PDF
        </button>
        <button class="close-btn" onclick="window.close()">
            ✕ Close
        </button>
    </div>

    {{-- Header --}}
    <div class="print-header">
        <div class="brand">
            <div class="brand-logo">DMS</div>
            <div>
                <div class="brand-name">Webfocus Document Management System</div>
                <div class="brand-sub">Administrative Report · Confidential</div>
            </div>
        </div>
        <div class="report-title">
            <h1>{{ $title }}</h1>
            <p>Generated: {{ $generated }}</p>
        </div>
    </div>

    {{-- Meta / Filters strip --}}
    <div class="meta-strip">
        @foreach ($filters as $label => $value)
            <div class="meta-item">
                <label>{{ $label }}</label>
                <span>{{ $value }}</span>
            </div>
        @endforeach
    </div>

    {{-- Summary --}}
    <div class="summary">
        <span class="summary-label">Report Results</span>
        <span class="summary-count">{{ $total }} {{ $total === 1 ? 'record' : 'records' }}</span>
    </div>

    {{-- Table --}}
    <table>
        <thead>
            <tr>
                @foreach ($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headers) }}" style="text-align:center; padding: 24px; color: #94a3b8;">
                        No records found.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Footer --}}
    <div class="print-footer">
        <span>Webfocus Document Management System &mdash; {{ $title }}</span>
        <span>Generated {{ $generated }} &bull; {{ $total }} record(s) &bull; Admin Report</span>
    </div>

    <script>
        // Auto-print when opened directly (not when viewing normally)
        if (window.opener || window.name === 'printWindow') {
            window.onload = function () { window.print(); };
        }
    </script>
</body>
</html>
