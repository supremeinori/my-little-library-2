/**
 * webview_host.h — Microsoft WebView2 Native Win32 Host
 */

#ifndef WEBVIEW_HOST_H
#define WEBVIEW_HOST_H

#include <windows.h>

#ifdef __cplusplus
extern "C" {
#endif

BOOL webview_host_init(HWND hWnd);
void webview_host_resize(HWND hWnd);
void webview_host_cleanup(void);

#ifdef __cplusplus
}
#endif

#endif /* WEBVIEW_HOST_H */
