# Branded PDF receipt update — 5 November 2026

Receipts now download as styled PDFs instead of plain text. The PDF contains AFRIPAY branding, amount and asset, business/supplier/invoice details, UTC creation time, full wallet address, receipt reference and an explicit simulation notice. No transaction hash, live settlement or fees are invented. Existing settled demo payments continue to work; browser data is not reset.

## Install on your Windows computer

1. In the VS Code terminal running the app, press **Ctrl+C** to stop it.
2. Extract `afripay-receipt-update.zip` into your existing `afripay-ai` project folder. Choose **Replace files in destination** when asked. The ZIP has `components`, `lib`, `public`, `tests`, `scripts`, `docs`, `package.json` and `package-lock.json` directly at its root. These belong beside your existing `app` folder, not in a nested project folder. Your `.env.local` is not included or changed.
3. In the VS Code terminal inside that project folder run:

```powershell
npm.cmd ci
npm.cmd run dev
```

4. Refresh http://localhost:3000 in the same browser you used for the demo.
5. Open **Transactions** and click **Receipt** for a settled demo payment. It downloads `AFRIPAY-Receipt-xxxxxxxx.pdf`.

If it still downloads a `.txt` file, the updated `components/workspace.tsx` did not replace the file in the project actually running, or the old server is still running. Check the folder and restart.

## Verification

- 51 unit/API/lifecycle/PDF tests passed.
- TypeScript check passed.
- Sample PDF was rendered and visually inspected, with its complete address and reference confirmed by PDF text extraction.
- Production dependency audit reports zero known vulnerabilities.
- Browser download interaction still needs confirmation on your PC.

New packages: `pdf-lib` and `@pdf-lib/fontkit`. Bundled DejaVu fonts are licensed in `public/fonts/LICENSE-DejaVu.txt`. These are loaded from the app itself; no third-party PDF service receives the receipt.
