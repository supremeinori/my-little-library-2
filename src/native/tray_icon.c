/**
 * tray_icon.c — System Tray (Notification Area) Management
 */

#include "tray_icon.h"
#include <wchar.h>

static NOTIFYICONDATAW g_nid = { 0 };
static BOOL g_tray_initialized = FALSE;

BOOL tray_icon_init(HWND hWnd, HINSTANCE hInstance) {
    if (g_tray_initialized) {
        return TRUE;
    }

    memset(&g_nid, 0, sizeof(NOTIFYICONDATAW));
    g_nid.cbSize = sizeof(NOTIFYICONDATAW);
    g_nid.hWnd = hWnd;
    g_nid.uID = 1;
    g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    g_nid.uCallbackMessage = WM_APP_TRAY_MSG;

    // Load custom application icon or fallback to default
    g_nid.hIcon = (HICON)LoadImageW(
        hInstance,
        MAKEINTRESOURCEW(IDI_APP_ICON),
        IMAGE_ICON,
        GetSystemMetrics(SM_CXSMICON),
        GetSystemMetrics(SM_CYSMICON),
        0
    );

    if (!g_nid.hIcon) {
        g_nid.hIcon = LoadIconW(NULL, IDI_APPLICATION);
    }

    wcsncpy(g_nid.szTip, L"My Little Library", sizeof(g_nid.szTip) / sizeof(wchar_t) - 1);
    g_nid.szTip[sizeof(g_nid.szTip) / sizeof(wchar_t) - 1] = L'\0';

    if (Shell_NotifyIconW(NIM_ADD, &g_nid)) {
        g_tray_initialized = TRUE;
        return TRUE;
    }

    return FALSE;
}

void tray_icon_remove(void) {
    if (g_tray_initialized) {
        Shell_NotifyIconW(NIM_DELETE, &g_nid);
        if (g_nid.hIcon) {
            DestroyIcon(g_nid.hIcon);
            g_nid.hIcon = NULL;
        }
        g_tray_initialized = FALSE;
    }
}

void tray_icon_show_balloon(const wchar_t *title, const wchar_t *msg) {
    if (!g_tray_initialized) return;

    NOTIFYICONDATAW nid = g_nid;
    nid.uFlags |= NIF_INFO;
    nid.dwInfoFlags = NIIF_INFO;

    wcsncpy(nid.szInfoTitle, title, sizeof(nid.szInfoTitle) / sizeof(wchar_t) - 1);
    nid.szInfoTitle[sizeof(nid.szInfoTitle) / sizeof(wchar_t) - 1] = L'\0';

    wcsncpy(nid.szInfo, msg, sizeof(nid.szInfo) / sizeof(wchar_t) - 1);
    nid.szInfo[sizeof(nid.szInfo) / sizeof(wchar_t) - 1] = L'\0';

    Shell_NotifyIconW(NIM_MODIFY, &nid);
}

void tray_icon_handle_message(HWND hWnd, LPARAM lParam) {
    switch (lParam) {
        case WM_LBUTTONUP:
        case WM_LBUTTONDBLCLK: {
            // Restore and bring the window to the foreground
            ShowWindow(hWnd, SW_RESTORE);
            SetForegroundWindow(hWnd);
            break;
        }
        case WM_RBUTTONUP:
        case WM_CONTEXTMENU: {
            POINT pt;
            GetCursorPos(&pt);

            HMENU hMenu = CreatePopupMenu();
            if (hMenu) {
                InsertMenuW(hMenu, 0, MF_BYPOSITION | MF_STRING, IDM_TRAY_OPEN, L"Open My Little Library");
                InsertMenuW(hMenu, 1, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuW(hMenu, 2, MF_BYPOSITION | MF_STRING, IDM_TRAY_EXIT, L"Exit");

                // Highlight "Open My Little Library" as default bold item
                SetMenuDefaultItem(hMenu, IDM_TRAY_OPEN, FALSE);

                // Required Win32 sequence for tray context menus
                SetForegroundWindow(hWnd);
                TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_BOTTOMALIGN, pt.x, pt.y, hWnd, NULL);
                PostMessageW(hWnd, WM_NULL, 0, 0);

                DestroyMenu(hMenu);
            }
            break;
        }
        default:
            break;
    }
}
