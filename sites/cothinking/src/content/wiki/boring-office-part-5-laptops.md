---
title: "Setting up IT for a small company, Part 5: Laptops"
description: Which operating system a small company's laptops should run, when Linux Mint with LibreOffice is worth considering in Malaysia, and the settings every laptop needs.
date: 2026-10-18
updated: 2026-10-20T07:51:41+00:00
author: jotham-lim
category: setting-up-it
series: The Boring Office
part: 5
---
## Let the software decide

Choose each laptop's operating system by the software its user needs, not by habit.

- **Windows** when the work depends on Windows-only software, such as a desktop accounting package or specialist industry software.
- **macOS** when it depends on Mac-only software, such as Final Cut Pro.
- **Any of the three** for everything else: email, web applications, documents and spreadsheets, which is most office work.

## Linux Mint as an option

[Linux Mint](https://linuxmint.com/) with its Cinnamon desktop looks and works much like Windows 7 and 10. It is free and shows no advertisements; staff used to Windows need a few days to adjust.

It runs well on older hardware. A five-year-old laptop that struggles with Windows 11 is often comfortable with Linux Mint, which lets a small company buy used laptops or keep its current ones for longer.

Its office suite is [LibreOffice](https://www.libreoffice.org/). LibreOffice saves in the OpenDocument format (`.odt`, `.ods`), an ISO standard (ISO/IEC 26300), and opens and saves Microsoft's `.docx` and `.xlsx` files.

## Malaysian services work in a browser

The government and banking services a small company uses every month run in a web browser, so they work on Linux Mint as on any other system.

| Service | On Linux Mint |
|---|---|
| LHDN: MyTax, e-Filing, e-PCB Plus, MyInvois | In the browser |
| KWSP i-Akaun Majikan, PERKESO ASSIST, HRD Corp e-TRiS | In the browser |
| SSM MyCoID and ezBiz | In the browser |
| Business banking (Maybank, CIMB, Public Bank, RHB, Hong Leong) | In the browser, approved on a phone app or a code token |
| SSM MBRS mTool | Windows only; usually run by the company secretary |
| SQL Account and AutoCount desktop editions | Windows only; use their cloud editions instead |

None of these portals publishes a list of supported browsers, and their help pages assume Chrome. Install Chrome or Chromium alongside Firefox.

## The limits

- **Excel macros.** LibreOffice doesn't run most Microsoft Office macros ([LibreOffice Help](https://help.libreoffice.org/latest/en-US/text/shared/guide/ms_user.html)). A spreadsheet that depends on them needs Microsoft Office.
- **Complex layouts.** A heavily formatted `.docx` may shift slightly when opened in LibreOffice. Open it in Google Docs or Office on the web instead.
- **Brand printer drivers.** Most office printers sold in the last ten years work without a driver (see below). Some Canon and Brother drivers, when one is needed, must be installed from the terminal.
- **One Windows-only program.** If a single program needs Windows, keep one Windows laptop for it, or run Windows in a virtual machine.

## Printers

Since Linux Mint 21, printers and scanners on the network or on USB are found and set up automatically, without a driver ([Linux Mint User Guide](https://linuxmint-user-guide.readthedocs.io/en/latest/printers.html)). When buying a printer, choose a network multifunction model whose specification lists **AirPrint, Mopria, or IPP Everywhere**, including scanning. It will then work with Linux Mint, Windows, macOS, and phones alike.

## Settings every laptop needs

Whatever the operating system:

1. **Full-disk encryption on**, so that a lost laptop doesn't expose the company's files.
2. **Automatic updates on.**
3. **A password manager installed** and signed in ([[Setting up IT for a small company, Part 3: Password managers|Part 3]]).
4. **A screen lock** after a few minutes away.
5. **Company files in the shared drive**, not only on the laptop ([[Setting up IT for a small company, Part 4: Email and files|Part 4]]), so that a lost or broken laptop costs only the laptop.

---

## See also

- [[Setting up IT for a small company, Part 1: The Boring Office]]
- [[Setting up IT for a small company, Part 6: Backups]]
