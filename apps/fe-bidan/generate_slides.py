import os

base_dir = r"C:\Users\ACER NITRO\.gemini\antigravity\scratch\project-bidan\project-bidan-main\apps\fe-bidan"
src_file = os.path.join(base_dir, "preview.html")
out_dir = os.path.join(base_dir, "slides")

with open(src_file, "r", encoding="utf-8") as f:
    content = f.read()

# Slide 1: Web Publik
s1 = content
with open(os.path.join(out_dir, "slide-1-web-publik.html"), "w", encoding="utf-8") as f:
    f.write(s1)

# Helper for dashboards
def make_dash_slide(view_id, title_text, pill_text, pill_bg, pill_color, active_bar_btn_id, active_bar_bg):
    res = content
    # Hide public page, show dashboard view
    res = res.replace('<div id="publicPageView">', '<div id="publicPageView" style="display: none;">')
    res = res.replace('<div id="dashboardView">', '<div id="dashboardView" style="display: block;">')
    
    # Hide all views first
    res = res.replace('<div id="dashSuperadminView" style="display: none;">', '<div id="dashSuperadminView" style="display: none;">')
    res = res.replace('<div id="dashAdminView" style="display: block;">', '<div id="dashAdminView" style="display: none;">')
    res = res.replace('<div id="dashBidanRMEView" style="display: none;">', '<div id="dashBidanRMEView" style="display: none;">')
    res = res.replace('<div id="dashPasienView" style="display: none;">', '<div id="dashPasienView" style="display: none;">')
    
    # Show target view
    res = res.replace(f'<div id="{view_id}" style="display: none;">', f'<div id="{view_id}" style="display: block;">')
    
    # Set title & pill
    res = res.replace(
        '<div id="dashRoleTitle" style="font-size: 0.75rem; color: var(--slate-500);">Dashboard Operasional Admin &amp; Antrean</div>',
        f'<div id="dashRoleTitle" style="font-size: 0.75rem; color: var(--slate-500);">{title_text}</div>'
    )
    
    # Quick role bar active state
    # Reset web button
    res = res.replace(
        'id="barBtnWeb" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700; border-radius: 9999px; border: none; cursor: pointer; background: var(--primary); color: #ffffff;',
        'id="barBtnWeb" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700; border-radius: 9999px; border: none; cursor: pointer; background: rgba(255, 255, 255, 0.12); color: #e2e8f0;'
    )
    # Highlight active button
    res = res.replace(
        f'id="{active_bar_btn_id}" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700; border-radius: 9999px; border: none; cursor: pointer; background: rgba(255, 255, 255, 0.12); color: #e2e8f0;',
        f'id="{active_bar_btn_id}" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700; border-radius: 9999px; border: none; cursor: pointer; background: {active_bar_bg}; color: #ffffff;'
    )
    
    return res

# Slide 2: Superadmin
s2 = make_dash_slide(
    "dashSuperadminView",
    "Pusat Keamanan &amp; Audit Trail Sistem — SUPERADMIN",
    "Role: SUPERADMIN (Audit Trail)",
    "#f3e8ff", "#7e22ce",
    "barBtnSuper", "#7e22ce"
)
with open(os.path.join(out_dir, "slide-2-superadmin.html"), "w", encoding="utf-8") as f:
    f.write(s2)

# Slide 3: Admin Operasional
s3 = make_dash_slide(
    "dashAdminView",
    "Dashboard Operasional Admin &amp; Loket Antrean",
    "Role: ADMIN_LOKAL",
    "#fef3c7", "#92400e",
    "barBtnAdmin", "#f59e0b"
)
with open(os.path.join(out_dir, "slide-3-admin-operasional.html"), "w", encoding="utf-8") as f:
    f.write(s3)

# Slide 4: Bidan Ria RME
s4 = make_dash_slide(
    "dashBidanRMEView",
    "Portal Rekam Medis Elektronik (RME) — Bdn. Ria Indrasti J., S.Keb",
    "Role: DOKTER (Bidan RME)",
    "#dcfce7", "#166534",
    "barBtnBidan", "#16a34a"
)
with open(os.path.join(out_dir, "slide-4-bidan-rme.html"), "w", encoding="utf-8") as f:
    f.write(s4)

# Slide 5: Pasien KIA
s5 = make_dash_slide(
    "dashPasienView",
    "Portal Pasien &amp; Buku KIA Digital",
    "Role: PASIEN",
    "#e0e7ff", "#3730a3",
    "barBtnPasien", "#4f46e5"
)
with open(os.path.join(out_dir, "slide-5-pasien-kia.html"), "w", encoding="utf-8") as f:
    f.write(s5)

print("Generated 5 slides successfully!")
