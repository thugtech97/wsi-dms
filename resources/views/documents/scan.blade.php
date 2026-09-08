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

        .countdown {
            margin-top: 14px; padding: 11px 13px;
            background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 9px;
            font-size: 12.5px; color: #4338ca; line-height: 1.5;
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .countdown strong { font-variant-numeric: tabular-nums; }
        .countdown button {
            background: #fff; border: 1px solid #c7d2fe; border-radius: 7px;
            padding: 5px 11px; font-size: 12px; font-weight: 600; color: #4f46e5;
            cursor: pointer; flex-shrink: 0; font-family: inherit;
        }

        .foot { margin-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="brand">
            <img src="{{ asset('img/ombudsman-logo.webp') }}" alt="Office of the Ombudsman seal">
            <div>
                <div class="brand-name">Office of the Ombudsman</div>
                <div class="brand-sub">Document Management System</div>
            </div>
        </div>

        <div class="card">
            <div class="card-head">
                <strong>Scanned Document</strong>
                <span>· {{ $code->type === 'QR' ? 'QR code' : 'Barcode' }}</span>
            </div>

            <div class="body">
                <div class="label">{{ $document->name }}</div>
                <div class="code">{{ $code->code_id }}</div>

                <dl class="meta">
                    <div class="meta-row">
                        <dt>Document Class</dt>
                        <dd>{{ $document->documentType?->name ?? '—' }}</dd>
                    </div>
                    <div class="meta-row">
                        <dt>Department</dt>
                        <dd>{{ $document->department ?: '—' }}</dd>
                    </div>
                    <div class="meta-row">
                        <dt>Document Date</dt>
                        <dd>{{ $document->created_at->format('M d, Y') }}</dd>
                    </div>
                </dl>

                @if ($autoOpenUrl)
                    <div class="countdown" id="countdown" hidden>
                        <span>Opening the document in <strong id="countdown-seconds">3</strong>s…</span>
                        <button type="button" id="countdown-cancel">Stay here</button>
                    </div>
                @endif

                <div class="actions">
                    @if ($documentUrl)
                        <a class="btn btn-primary" href="{{ $documentUrl }}" rel="noopener">Open Document</a>
                    @endif

                    @if ($fileUrl)
                        <a class="btn {{ $documentUrl ? 'btn-secondary' : 'btn-primary' }}" href="{{ $fileUrl }}" rel="noopener">Open Attached File</a>
                    @endif

                    <a class="btn btn-quiet" href="{{ route('login') }}">Sign in to the DMS</a>
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
            Office of the Ombudsman · Document Management System<br>
            Scanned {{ now()->format('M d, Y h:i A') }}
        </p>
    </div>

    @if ($autoOpenUrl)
        <script>
            (function () {
                var url    = @json($autoOpenUrl);
                var box    = document.getElementById('countdown');
                var digits = document.getElementById('countdown-seconds');
                var cancel = document.getElementById('countdown-cancel');
                var left   = 3;

                box.hidden = false;

                var tick = setInterval(function () {
                    left -= 1;
                    if (left > 0) {
                        digits.textContent = left;
                        return;
                    }
                    clearInterval(tick);
                    // replace(), not assign() — going back should return to the
                    // scanner, not to a page that immediately redirects again.
                    window.location.replace(url);
                }, 1000);

                cancel.addEventListener('click', function () {
                    clearInterval(tick);
                    box.hidden = true;
                });
            })();
        </script>
    @endif
</body>
</html>
