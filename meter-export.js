/* ============================================================
   meter-export.js
   Canvas renderer + PNG export + storage reset.
   Depends on window.MeterApp being exposed by the page script.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Configuration ---------- */

  var FONT_STACK = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
  //var RATE_PER_UNIT = 250;

  var COLUMNS = [
    { key: 'index',   label: 'S/N',                width: 54  },
    { key: 'name',    label: 'Customer Name',      width: 170 },
    { key: 'oldunit', label: 'Previous Unit',      width: 108 },
    { key: 'newunit', label: 'Current Unit',       width: 108 },
    { key: 'diff',    label: 'Consumption',        width: 108 },
    { key: 'cost',    label: 'Total Cost (Naira)', width: 128 },
    { key: 'remark',  label: 'Summary',            width: 320 }
  ];
  
  var rsum

  var THEME = {
    ink:        '#12313a',
    muted:      '#5d8592',
    line:       '#d9eff5',
    white:      '#ffffff',
    rowAlt:     '#f0fdff',
    cyanDeep:   '#0e7490',
    cyanMid:    '#0891b2',
    cyanLight:  '#06b6d4',
    cyanPale:   '#aeeaf4',
    titleInk:   '#164e63'
  };

  var PAD          = 32;
  var HEADER_H     = 48;
  var CELL_PAD_X   = 14;
  var CELL_PAD_Y   = 14;
  var LINE_H       = 19;
  var ROW_MIN_H    = 48;
  var TITLE_H      = 30;
  var SUBTITLE_H   = 20;
  var HEADER_GAP   = 18;
  var RADIUS       = 14;

  var TABLE_W = COLUMNS.reduce(function (sum, c) { return sum + c.width; }, 0);
  var CANVAS_W = TABLE_W + PAD * 2;

  /* ---------- Small helpers ---------- */

  function roundedRectPath(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /* Truncates single-line text with an ellipsis when it overflows. */
  function fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    var out = text;
    while (out.length > 1 && ctx.measureText(out + '\u2026').width > maxWidth) {
      out = out.slice(0, -1);
    }
    return out + '\u2026';
  }

  /* Wraps a sentence into lines that fit maxWidth. Breaks long words. */
  function wrapText(ctx, text, maxWidth) {
    var words = String(text).split(/\s+/).filter(Boolean);
    var lines = [];
    var line = '';

    for (var i = 0; i < words.length; i++) {
      var word = words[i];

      if (ctx.measureText(word).width > maxWidth) {
        if (line) { lines.push(line); line = ''; }
        var chunk = '';
        for (var j = 0; j < word.length; j++) {
          var ch = word.charAt(j);
          if (ctx.measureText(chunk + ch).width > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
        continue;
      }

      var candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }

    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function buildFilename() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return 'meter-records-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.png';
  }

  function formatToday() {
    try {
      return new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return new Date().toDateString();
    }
  }

  function showToast(text, tone) {
    var el = document.createElement('div');
    el.className = 'meter-toast' + (tone === 'error' ? ' is-error' : '');
    el.textContent = text;
    document.body.appendChild(el);

    requestAnimationFrame(function () { el.classList.add('is-visible'); });

    setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () { el.remove(); }, 300);
    }, 2600);
  }

  /* ---------- Data access ---------- */

  function getRecords() {
    if (window.MeterApp && typeof window.MeterApp.getData === 'function') {
      var live = window.MeterApp.getData();
      if (Array.isArray(live)) return live;
    }
    try {
      var raw = JSON.parse(localStorage.getItem('data') || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  /* ---------- Canvas builder ---------- */
  
  
  
    function calc() {
      let x= JSON.parse(localStorage.getItem('data'))
      let rsu = 0
      for (let i = 0; i < x.length; i++) {
        x[i].costh = x[i].costh
        
        rsu = rsu + x[i].costh
        
      }
      return rsu
    }
    

  function buildCanvas() {
    var records = getRecords();
rsum = ft(calc())
console.log(rsum)

    if (!records.length) {
      showToast('There are no records to export yet.', 'error');
      return null;
    }

    /* Newest first, matching the on-screen table order. */
    var ordered = records.slice().reverse();

    /* --- Measure pass (off-screen context) --- */
    var measureCanvas = document.createElement('canvas');
    var mctx = measureCanvas.getContext('2d');

    var summaryCol = COLUMNS[6];
    var summaryMaxW = summaryCol.width - CELL_PAD_X * 2;
    mctx.font = '400 13px ' + FONT_STACK;

    var rowLines = ordered.map(function (rec) {
      return wrapText(mctx, rec.remark, summaryMaxW);
    });

    var rowHeights = rowLines.map(function (lines) {
      return Math.max(ROW_MIN_H, lines.length * LINE_H + CELL_PAD_Y * 2);
    });

    var tableH = HEADER_H + rowHeights.reduce(function (a, b) { return a + b; }, 0);
    var canvasH = PAD + TITLE_H + SUBTITLE_H + HEADER_GAP + tableH + PAD;

    /* --- Real canvas, rendered at 2x for crisp output --- */
    var scale = Math.max(2, window.devicePixelRatio || 1);
    var canvas = document.createElement('canvas');
    canvas.width = CANVAS_W * scale;
    canvas.height = canvasH * scale;

    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.textBaseline = 'top';

    /* Background */
    ctx.fillStyle = THEME.white;
    ctx.fillRect(0, 0, CANVAS_W, canvasH);

    /* Cyan accent bar across the top */
    var accent = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
    accent.addColorStop(0, THEME.cyanLight);
    accent.addColorStop(1, THEME.cyanPale);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, CANVAS_W, 5);

    /* Title + subtitle */
    ctx.font = '700 22px ' + FONT_STACK;
    ctx.fillStyle = THEME.titleInk;
    ctx.fillText('Meter Reading & Billing Records', PAD, PAD + 2);
  
    var subtitle = 'Generated ' + formatToday() +
                   '  \u00b7  ' + ordered.length + ' record' + (ordered.length === 1 ? '' : 's') +
                   '  \u00b7  Rate \u20a6' + RATE_PER_UNIT + ' per unit'  + '  \u00b7  Total \u20a6' + rsum  
    var ref = 'Want To Create Yours Visit meterReading.netlify.app on Your Browser'

    ctx.font = '400 13px ' + FONT_STACK;
    ctx.fillStyle = THEME.muted;
    ctx.fillText(subtitle, PAD, PAD + 32);

    var tableTop = PAD + TITLE_H + SUBTITLE_H + HEADER_GAP;

    /* --- Table, clipped to rounded corners --- */
    ctx.save();
    roundedRectPath(ctx, PAD, tableTop, TABLE_W, tableH, RADIUS);
    ctx.clip();

    /* Header band */
    var headerGrad = ctx.createLinearGradient(0, tableTop, 0, tableTop + HEADER_H);
    headerGrad.addColorStop(0, THEME.cyanMid);
    headerGrad.addColorStop(1, THEME.cyanDeep);
    ctx.fillStyle = headerGrad;
    ctx.fillRect(PAD, tableTop, TABLE_W, HEADER_H);

    /* Header labels */
    ctx.font = '700 11px ' + FONT_STACK;
    ctx.fillStyle = THEME.white;
    var hx = PAD;
    COLUMNS.forEach(function (col) {
      ctx.fillText(col.label.toUpperCase(), hx + CELL_PAD_X, tableTop + 19);
      hx += col.width;
    });

    /* Body rows */
    var rowY = tableTop + HEADER_H;

    ordered.forEach(function (rec, i) {
      var h = rowHeights[i];

      ctx.fillStyle = (i % 2 === 0) ? THEME.white : THEME.rowAlt;
      ctx.fillRect(PAD, rowY, TABLE_W, h);

      ctx.fillStyle = THEME.line;
      ctx.fillRect(PAD, rowY + h - 1, TABLE_W, 1);

      var cells = [
        String(i + 1),
        String(rec.name),
        String(rec.oldunit),
        String(rec.newunit),
        String(rec.diff),
        String(rec.cost),
        null
      ];

      var cx = PAD;
      var textY = rowY + CELL_PAD_Y;

      COLUMNS.forEach(function (col, ci) {
        var x = cx + CELL_PAD_X;
        var maxW = col.width - CELL_PAD_X * 2;

        if (ci === 6) {
          /* Summary column wraps across multiple lines */
          ctx.font = '400 13px ' + FONT_STACK;
          ctx.fillStyle = THEME.muted;
          rowLines[i].forEach(function (line, li) {
            ctx.fillText(line, x, textY + li * LINE_H);
          });
        } else if (ci === 5) {
          /* Cost — emphasised */
          ctx.font = '700 10px ' + FONT_STACK;
          ctx.fillStyle = THEME.cyanDeep;
          ctx.fillText(fitText(ctx, cells[ci], maxW), x, textY);
        } else if (ci === 0) {
          /* Serial number — muted */
          ctx.font = '400 13px ' + FONT_STACK;
          ctx.fillStyle = THEME.muted;
          ctx.fillText(fitText(ctx, cells[ci], maxW), x, textY);
        } else {
          ctx.font = '400 13px ' + FONT_STACK;
          ctx.fillStyle = THEME.ink;
          ctx.fillText(fitText(ctx, cells[ci], maxW), x, textY);
        }

        cx += col.width;
      });

      rowY += h;
    });

    ctx.restore();

    /* Outer border on top of the clip */
    ctx.lineWidth = 1;
    ctx.strokeStyle = THEME.line;
    roundedRectPath(ctx, PAD + 0.5, tableTop + 0.5, TABLE_W - 1, tableH - 1, RADIUS);
    ctx.stroke();

    return canvas;
  }

  /* ---------- Blob + save helpers ---------- */

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('The image could not be generated.'));
      }, 'image/png');
    });
  }

  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------- Public actions ---------- */

  function download() {
    var canvas = buildCanvas();
    if (!canvas) return;

    toBlob(canvas)
      .then(function (blob) {
        saveBlob(blob, buildFilename());
        showToast('Image saved to your downloads.');
      })
      .catch(function (err) {
        console.error(err);
        showToast('Sorry, the image could not be saved.', 'error');
      });
  }

  function share() {
    var canvas = buildCanvas();
    if (!canvas) return;

    toBlob(canvas)
      .then(function (blob) {
        var filename = buildFilename();

        var canShareFiles = false;
        try {
          var probe = new File([blob], filename, { type: 'image/png' });
          canShareFiles = typeof navigator.canShare === 'function' &&
                          navigator.canShare({ files: [probe] });
        } catch (e) {
          canShareFiles = false;
        }

        if (canShareFiles) {
          var file = new File([blob], filename, { type: 'image/png' });
          return navigator
            .share({ files: [file], title: 'Meter Reading & Billing Records' })
            .catch(function (err) {
              if (err && err.name === 'AbortError') return;   /* user cancelled */
              saveBlob(blob, filename);                       /* fallback */
            });
        }

        /* Sharing not available here — download instead */
        saveBlob(blob, filename);
        showToast('Sharing is not supported here, so the image was downloaded.');
      })
      .catch(function (err) {
        console.error(err);
        showToast('Sorry, the image could not be shared.', 'error');
      });
  }

  function clearAll() {
    var records = getRecords();

    if (!records.length) {
      showToast('There are no saved records to clear.');
      return;
    }

    var confirmed = window.confirm(
      'This will permanently delete all saved meter records from this device.\n\n' +
      'This action cannot be undone. Do you want to continue?'
    );
    if (!confirmed) return;

    try {
      localStorage.removeItem('data');
    } catch (e) {
      /* storage unavailable — carry on and clear the in-memory list */
    }

    if (window.MeterApp && typeof window.MeterApp.reset === 'function') {
      window.MeterApp.reset();
    } else if (window.MeterApp && typeof window.MeterApp.render === 'function') {
      window.MeterApp.render();
    }

    showToast('All saved records have been cleared.');
  }

  /* ---------- Expose ---------- */

  window.MeterExport = {
    download: download,
    share: share,
    clearAll: clearAll,
    buildCanvas: buildCanvas      /* handy for debugging */
  };
})();