{{--
    Where a scanned QR lands. It shows the code image and the document's details
    (additional information included, Added By last, blank rows left out) and
    offers its URL and attached file as links rather than forwarding to them —
    a scan ends here, not on an external site the reader never chose to open.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $document->name }} — {{ config('app.name') }}</title>
    <link rel="icon" type="image/webp" href="{{ asset('img/ombudsman-logo.webp') }}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f6f8fa; color: #334155;
            min-height: 100vh; padding: 20px 16px;
            display: flex; align-items: flex-start; justify-content: center;
        }
        .sheet { width: 100%; max-width: 460px; }

        .brand {
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 16px; justify-content: center; text-align: center;
        }
        .brand img { width: 42px; height: 42px; object-fit: contain; flex-shrink: 0; }
        .brand-name { font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.25; text-align: left; }
        .brand-sub  { font-size: 11px; color: #64748b; }

        .card {
            background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;
        }
        .card-head {
            padding: 14px 18px; border-bottom: 1px solid #f1f5f9; background: #fafbff;
            display: flex; align-items: center; gap: 8px;
        }
        .card-head strong { font-size: 13px; color: #0f172a; }
        .card-head span   { font-size: 11px; color: #94a3b8; }

        .body { padding: 18px; }
        .code-img {
            display: flex; justify-content: center; margin-bottom: 14px;
        }
        .code-img img {
            width: 160px; height: auto; padding: 10px;
            border: 1px solid #e2e8f0; border-radius: 10px; background: #fff;
        }
        .code-img img.bc { width: 240px; padding: 12px 16px; }
        .section {
            margin: 16px 0 4px; font-size: 10px; font-weight: 700; color: #94a3b8;
            text-transform: uppercase; letter-spacing: 0.6px;
        }
        .label { font-size: 17px; font-weight: 700; color: #0f172a; line-height: 1.35; word-break: break-word; }
        .code {
            display: inline-block; margin-top: 8px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; font-weight: 700;
            color: #4f46e5; background: #eef2ff; border: 1px solid #c7d2fe;
            border-radius: 6px; padding: 3px 10px; letter-spacing: 0.5px;
        }

        .meta { margin-top: 16px; border-top: 1px solid #f1f5f9; padding-top: 14px; }
        .meta-row { display: flex; justify-content: space-between; gap: 14px; font-size: 13px; padding: 5px 0; }
        .meta-row dt { color: #94a3b8; flex-shrink: 0; }
        .meta-row dd { color: #334155; font-weight: 500; text-align: right; word-break: break-word; }

        .actions { margin-top: 18px; display: flex; flex-direction: column; gap: 9px; }
        .btn {
            display: block; width: 100%; padding: 12px 16px;
            border-radius: 9px; font-size: 14px; font-weight: 600;
            text-align: center; text-decoration: none; border: 1px solid transparent;
        }
        .btn-primary   { background: #6366f1; color: #fff; }
        .btn-secondary { background: #fff; color: #4f46e5; border-color: #c7d2fe; }
        .btn-quiet     { background: #f8fafc; color: #475569; border-color: #e2e8f0; }

        .url-note {
            margin-top: 14px; padding: 11px 13px;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px;
            font-size: 11px; color: #64748b; line-height: 1.6; word-break: break-all;
        }
        .url-note span { display: block; color: #94a3b8; margin-bottom: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; font-size: 10px; }
        .url-note a { color: #4f46e5; text-decoration: none; }

        .empty {
            margin-top: 16px; padding: 13px;
            background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px;
            font-size: 12.5px; color: #92400e; line-height: 1.55;
        }

        .foot { margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6; }
    </style>
</head>
<body>
    @php [$brandName, $brandSub] = \App\Models\SystemSetting::brand(); @endphp
    <div class="sheet">
        <div class="brand">
            <img src="{{ asset('img/ombudsman-logo.webp') }}" alt="Office of the Ombudsman seal">
            <div>
                <div class="brand-name">{{ $brandName }}</div>
                @if ($brandSub)<div class="brand-sub">{{ $brandSub }}</div>@endif
            </div>
        </div>

        <div class="card">
            <div class="card-head">
                <strong>Scanned Document</strong>
                <span>· {{ $code->type === 'QR' ? 'QR code' : 'Barcode' }}</span>
            </div>

            <div class="body">
                @if ($code->imageUrl())
                    <div class="code-img">
                        <img src="{{ $code->imageUrl() }}" alt="{{ $code->code_id }}" class="{{ $code->type === 'QR' ? 'qr' : 'bc' }}">
                    </div>
                @endif

                <div class="label">{{ $document->name }}</div>
                <div class="code">{{ $code->code_id }}</div>

                @php
                    // Same order as the printed label; blank rows are dropped.
                    $rows = array_filter([
                        'Document Type' => $document->documentType?->name,
                        'Department'    => $document->folder?->name,
                        'Document Date' => \App\Models\SystemSetting::formatDate($document->created_at),
                    ], fn ($v) => $v !== null && $v !== '' && $v !== '—');
                @endphp

                <dl class="meta">
                    @foreach ($rows as $label => $value)
                        <div class="meta-row">
                            <dt>{{ $label }}</dt>
                            <dd>{{ $value }}</dd>
                        </div>
                    @endforeach

                    @if ($extraRows)
                        <div class="section">Additional Information</div>
                        @foreach ($extraRows as $label => $value)
                            <div class="meta-row">
                                <dt>{{ $label }}</dt>
                                <dd>{{ $value }}</dd>
                            </div>
                        @endforeach
                    @endif

                    @if ($document->owner)
                        <div class="meta-row">
                            <dt>Added By</dt>
                            <dd>{{ $document->owner->name }}</dd>
                        </div>
                    @endif
                </dl>

                <div class="actions">
                    @if ($documentUrl)
                        <a class="btn btn-primary" href="{{ $documentUrl }}" rel="noopener">Open Document</a>
                    @endif

                    @if ($fileUrl)
                        <a class="btn {{ $documentUrl ? 'btn-secondary' : 'btn-primary' }}" href="{{ $fileUrl }}" rel="noopener">Open Attached File</a>
                    @endif

                    @if ($dmsUrl)
                        <a class="btn btn-quiet" href="{{ $dmsUrl }}">Open in the DMS</a>
                    @else
                        <a class="btn btn-quiet" href="{{ route('login') }}">Sign in to the DMS</a>
                    @endif
                </div>

                @if ($documentUrl)
                    <div class="url-note">
                        <span>Document URL</span>
                        <a href="{{ $documentUrl }}" rel="noopener">{{ $documentUrl }}</a>
                    </div>
                @elseif (! $fileUrl)
                    <div class="empty">
                        This document has no URL or attached file on record. Sign in to the DMS to view its full details.
                    </div>
                @endif
            </div>
        </div>

        <p class="foot">
            {{ $brandName }}{{ $brandSub ? ' · ' . $brandSub : '' }}<br>
            Scanned {{ \App\Models\SystemSetting::formatDateTime(now()) }}
        </p>
    </div>
</body>
</html>
