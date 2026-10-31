/**
 * app_window.h — Application Window Management & Lifecycle
 */

#ifndef APP_WINDOW_H
#define APP_WINDOW_H

#include <windows.h>

#define WINDOW_CLASS_NAME       L"MyLittleLibrary_WindowClass"
#define WINDOW_TITLE            L"My Little Library"
#define WM_APP_RESTORE_INSTANCE (WM_APP + 102)

#ifdef __cplusplus
extern "C" {
#endif

HWND app_window_create(HINSTANCE hInstance, int nCmdShow);

#ifdef __cplusplus
}
#endif

#endif /* APP_WINDOW_H */
