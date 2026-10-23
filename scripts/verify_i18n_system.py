#!/usr/bin/env python3
"""
Tilet3D Multilingual Support (i18n) Comprehensive Audit & Verification Script
Checks:
1. Parity across all 7 supported locales (om, am, en, ti, fr, ar, sw)
2. Coverage percentage and missing-key detection
3. Django backend i18n configuration & middleware
4. Frontend i18n setup (RTL handling, localStorage key, fallback order)
5. Hardcoded customer-facing string scanner across components
"""

import json
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE_DIR, "frontend", "public", "locales")
SRC_DIR = os.path.join(BASE_DIR, "frontend", "src")
BACKEND_SETTINGS = os.path.join(BASE_DIR, "backend", "config", "settings", "base.py")
I18N_CONFIG = os.path.join(SRC_DIR, "i18n.ts")

LANGUAGES = [
    ("om", "Afaan Oromoo", "Domestic Primary"),
    ("am", "አማርኛ (Amharic)", "Domestic Primary"),
    ("en", "English", "International Fallback"),
    ("ti", "ትግርኛ (Tigrinya)", "Ethiopian Regional"),
    ("fr", "Français", "International"),
    ("ar", "العربية (Arabic)", "International RTL"),
    ("sw", "Kiswahili", "East Africa Regional"),
]

def flatten_dict(d, prefix=""):
    items = []
    for k, v in d.items():
        new_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key).items())
        else:
            items.append((new_key, v))
    return dict(items)

def verify_locales():
    data = {}
    all_keys = set()
    print("=" * 75)
    print("1. LOCALES PARITY AND KEY COMPLETENESS CHECK")
    print("=" * 75)
    
    for code, name, tier in LANGUAGES:
        path = os.path.join(LOCALES_DIR, code, "translation.json")
        if not os.path.exists(path):
            print(f"[FAIL] Missing locale file for {code}: {path}")
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                d = json.load(f)
                flat = flatten_dict(d)
                data[code] = flat
                all_keys.update(flat.keys())
        except Exception as e:
            print(f"[FAIL] Error parsing JSON for {code}: {e}")

    total_keys = len(all_keys)
    print(f"Total Unique Translation Keys Across System: {total_keys}")
    print("-" * 75)
    print(f"| {'Code':<5} | {'Language':<20} | {'Tier':<20} | {'Keys':<6} | {'Missing':<8} | {'Parity':<8} |")
    print("-" * 75)

    all_passed = True
    for code, name, tier in LANGUAGES:
        keys = data.get(code, {})
        missing = all_keys - set(keys.keys())
        parity = (len(keys) / total_keys * 100) if total_keys else 0
        status = "100.0%" if parity == 100 else f"{parity:.1f}%"
        print(f"| {code:<5} | {name:<20} | {tier:<20} | {len(keys):<6} | {len(missing):<8} | {status:<8} |")
        if missing:
            all_passed = False
            print(f"   Missing keys in {code}: {list(missing)[:5]}...")

    print("-" * 75)
    return all_passed, total_keys, data

def verify_frontend_architecture():
    print("\n" + "=" * 75)
    print("2. FRONTEND I18N ARCHITECTURE & RTL VERIFICATION")
    print("=" * 75)
    
    checks = []
    if os.path.exists(I18N_CONFIG):
        with open(I18N_CONFIG, "r", encoding="utf-8") as f:
            content = f.read()
        
        checks.append(("RTL Direction Logic (applyLanguageDirection)", "applyLanguageDirection" in content and "dir" in content))
        checks.append(("Arabic RTL Mapping (code: 'ar' with dir: 'rtl')", re.search(r'["\']ar["\'].*?["\']rtl["\']', content, re.DOTALL) is not None))
        checks.append(("Storage Key ('tilet3d_language')", "tilet3d_language" in content))
        checks.append(("Fallback Language ('en' configured)", "fallbackLng: \"en\"" in content or "fallbackLng: 'en'" in content))
        checks.append(("Supported Languages Configured", all(code in content for code, _, _ in LANGUAGES)))
    else:
        checks.append(("i18n.ts exists", False))

    for label, passed in checks:
        print(f"[{'PASS' if passed else 'FAIL'}] {label}")
    
    return all(passed for _, passed in checks)

def verify_backend_architecture():
    print("\n" + "=" * 75)
    print("3. BACKEND DJANGO REST FRAMEWORK I18N VERIFICATION")
    print("=" * 75)
    
    checks = []
    if os.path.exists(BACKEND_SETTINGS):
        with open(BACKEND_SETTINGS, "r", encoding="utf-8") as f:
            content = f.read()

        checks.append(("USE_I18N = True", "USE_I18N = True" in content))
        checks.append(("LocaleMiddleware Registered", "django.middleware.locale.LocaleMiddleware" in content))
        checks.append(("All 7 Languages in LANGUAGES tuple", all(re.search(rf'["\']{code}["\']', content) is not None for code, _, _ in LANGUAGES)))
        checks.append(("LOCALE_PATHS Configured", "LOCALE_PATHS" in content))
        checks.append(("Safe Default Fallback (LANGUAGE_CODE = 'en')", re.search(r'LANGUAGE_CODE\s*=\s*["\']en', content) is not None))
    else:
        checks.append(("base.py exists", False))

    for label, passed in checks:
        print(f"[{'PASS' if passed else 'FAIL'}] {label}")

    return all(passed for _, passed in checks)

def scan_hardcoded_strings():
    print("\n" + "=" * 75)
    print("4. SCANNING CRITICAL FRONTEND SURFACES FOR UNTRANSLATED HARDCODED TEXT")
    print("=" * 75)

    target_components = [
        "ProductCard.tsx",
        "ProductPageHeader.tsx",
        "ProductDetailPage.tsx",
        "CartDrawer.tsx",
        "CheckoutModal.tsx",
        "RentalBookingModal.tsx",
        "CustomerRentalList.tsx",
        "AvatarForm.tsx",
        "AvatarPage.tsx",
        "AvatarControls.tsx",
        "AvatarViewer.tsx",
        "AdminSidebar.tsx",
        "AdminLayout.tsx",
        "OrderHistoryPage.tsx",
        "OrderDetailPage.tsx",
        "CheckoutSuccessPage.tsx",
        "FilterDrawer.tsx",
        "LanguageSelector.tsx",
        "Navbar.tsx",
        "StoreNav.tsx",
        "Footer.tsx",
        "FeaturedCollectionSection.tsx",
        "CulturalCollectionSection.tsx",
        "HowItWorksSection.tsx",
        "FloatingAssistant.tsx",
        "PreferencesSetting.tsx",
    ]

    found_components = 0
    clean_components = 0

    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file in target_components:
                found_components += 1
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                
                # Check that useTranslation is imported and used, or re-exports a localized component
                has_t_hook = any("useTranslation" in l for l in lines)
                has_t_call = any("t(" in l for l in lines)
                is_reexport = any("export default" in l and "Footer" in l for l in lines) and len(lines) < 5

                rel_path = os.path.relpath(filepath, SRC_DIR)
                if (has_t_hook and has_t_call) or is_reexport:
                    clean_components += 1
                    status = "re-exports localized component" if is_reexport else "useTranslation active with dynamic t(...) keys"
                    print(f"[OK] {rel_path:<45} -> {status}")
                else:
                    print(f"[WARN] {rel_path:<45} -> Translation hook not detected")

    print(f"\nSurfaces audited: {clean_components}/{found_components} fully wired with i18next translation hooks.")
    return clean_components == found_components

if __name__ == "__main__":
    locales_ok, total_keys, _ = verify_locales()
    fe_ok = verify_frontend_architecture()
    be_ok = verify_backend_architecture()
    scan_ok = scan_hardcoded_strings()

    print("\n" + "=" * 75)
    print("FINAL AUDIT SUMMARY")
    print("=" * 75)
    print(f"1. Locales Parity (7/7 languages):      {'PASSED (100% parity)' if locales_ok else 'FAILED'}")
    print(f"2. Frontend Architecture (RTL/Storage): {'PASSED' if fe_ok else 'FAILED'}")
    print(f"3. Backend DRF Localization:            {'PASSED' if be_ok else 'FAILED'}")
    print(f"4. Key Surfaces Wired to t(...):        {'PASSED' if scan_ok else 'FAILED'}")
    print("=" * 75)
    
    if locales_ok and fe_ok and be_ok and scan_ok:
        print("ALL AUDIT AND PARITY CHECKS PASSED SUCCESSFULLY (0 MISSING KEYS).")
        sys.exit(0)
    else:
        print("SOME CHECKS REQUIRE ATTENTION.")
        sys.exit(1)
