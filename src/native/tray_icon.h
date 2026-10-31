/**
 * tray_icon.h — System Tray (Notification Area) Management
 */

#ifndef TRAY_ICON_H
#define TRAY_ICON_H

#include <windows.h>
#include <shellapi.h>

#define WM_APP_TRAY_MSG (WM_APP + 101)

#define IDM_TRAY_OPEN 2001
#define IDM_TRAY_EXIT 2002

#define IDI_APP_ICON 101

#ifdef __cplusplus
extern "C" {
#endif

BOOL tray_icon_init(HWND hWnd, HINSTANCE hInstance);
void tray_icon_remove(void);
void tray_icon_show_balloon(const wchar_t *title, const wchar_t *msg);
void tray_icon_handle_message(HWND hWnd, LPARAM lParam);

#ifdef __cplusplus
}
#endif

#endif /* TRAY_ICON_H */
