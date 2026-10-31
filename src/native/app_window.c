/**
 * app_window.c — Application Window Management & Lifecycle
 */

#include "app_window.h"
#include "tray_icon.h"
#include "webview_host.h"

static BOOL g_first_close_notified = FALSE;

static LRESULT CALLBACK AppWindowProc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_CREATE: {
            HINSTANCE hInstance = ((LPCREATESTRUCT)lParam)->hInstance;
            tray_icon_init(hWnd, hInstance);
            webview_host_init(hWnd);
            return 0;
        }

        case WM_SIZE: {
            webview_host_resize(hWnd);
            return 0;
        }

        case WM_GETMINMAXINFO: {
            LPMINMAXINFO mmi = (LPMINMAXINFO)lParam;
            mmi->ptMinTrackSize.x = 720;
            mmi->ptMinTrackSize.y = 520;
            return 0;
        }

        case WM_CLOSE: {
            // Hide to system tray instead of destroying window (FR-02)
            ShowWindow(hWnd, SW_HIDE);

            if (!g_first_close_notified) {
                tray_icon_show_balloon(
                    L"My Little Library",
                    L"The application is still running in the system tray. Right-click the icon to exit."
                );
                g_first_close_notified = TRUE;
            }
            return 0;
        }

        case WM_APP_TRAY_MSG: {
            tray_icon_handle_message(hWnd, lParam);
            return 0;
        }

        case WM_APP_RESTORE_INSTANCE: {
            // Focus and bring forward when another instance attempts to launch
            if (IsIconic(hWnd)) {
                ShowWindow(hWnd, SW_RESTORE);
            } else {
                ShowWindow(hWnd, SW_SHOW);
            }
            SetForegroundWindow(hWnd);
            return 0;
        }

        case WM_COMMAND: {
            switch (LOWORD(wParam)) {
                case IDM_TRAY_OPEN: {
                    ShowWindow(hWnd, SW_RESTORE);
                    SetForegroundWindow(hWnd);
                    return 0;
                }
                case IDM_TRAY_EXIT: {
                    tray_icon_remove();
                    DestroyWindow(hWnd);
                    return 0;
                }
            }
            break;
        }

        case WM_DESTROY: {
            tray_icon_remove();
            webview_host_cleanup();
            PostQuitMessage(0);
            return 0;
        }
    }

    return DefWindowProcW(hWnd, uMsg, wParam, lParam);
}

HWND app_window_create(HINSTANCE hInstance, int nCmdShow) {
    WNDCLASSEXW wcex = { 0 };
    wcex.cbSize        = sizeof(WNDCLASSEXW);
    wcex.style         = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc   = AppWindowProc;
    wcex.hInstance     = hInstance;
    wcex.hCursor       = LoadCursorW(NULL, IDC_ARROW);
    wcex.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wcex.lpszClassName = WINDOW_CLASS_NAME;

    wcex.hIcon = (HICON)LoadImageW(
        hInstance,
        MAKEINTRESOURCEW(IDI_APP_ICON),
        IMAGE_ICON,
        GetSystemMetrics(SM_CXICON),
        GetSystemMetrics(SM_CYICON),
        0
    );
    if (!wcex.hIcon) wcex.hIcon = LoadIconW(NULL, IDI_APPLICATION);

    wcex.hIconSm = (HICON)LoadImageW(
        hInstance,
        MAKEINTRESOURCEW(IDI_APP_ICON),
        IMAGE_ICON,
        GetSystemMetrics(SM_CXSMICON),
        GetSystemMetrics(SM_CYSMICON),
        0
    );
    if (!wcex.hIconSm) wcex.hIconSm = LoadIconW(NULL, IDI_APPLICATION);

    if (!RegisterClassExW(&wcex)) {
        MessageBoxW(NULL, L"Failed to register application window class.", L"Error", MB_ICONERROR | MB_OK);
        return NULL;
    }

    // Default centered dimensions: 1200 x 800
    int width = 1200;
    int height = 800;
    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);
    int x = (screenWidth - width) / 2;
    int y = (screenHeight - height) / 2;
    if (x < 0) x = CW_USEDEFAULT;
    if (y < 0) y = CW_USEDEFAULT;

    HWND hWnd = CreateWindowExW(
        0,
        WINDOW_CLASS_NAME,
        WINDOW_TITLE,
        WS_OVERLAPPEDWINDOW,
        x, y, width, height,
        NULL,
        NULL,
        hInstance,
        NULL
    );

    if (!hWnd) {
        MessageBoxW(NULL, L"Failed to create main application window.", L"Error", MB_ICONERROR | MB_OK);
        return NULL;
    }

    ShowWindow(hWnd, nCmdShow);
    UpdateWindow(hWnd);

    return hWnd;
}
