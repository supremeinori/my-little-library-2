/**
 * main.c — My Little Library Windows Desktop Entry Point
 * Implements Single-Instance enforcement, DPI initialization, and message loop.
 */

#include <windows.h>
#include "app_window.h"

#define SINGLE_INSTANCE_MUTEX L"Global\\MyLittleLibrary_SingleInstance_Mutex_v2"

// Dynamic DPI function prototype
typedef BOOL (WINAPI *SetProcessDpiAwarenessContextFn)(DPI_AWARENESS_CONTEXT);

static void InitializeDpiAwareness(void) {
    HMODULE hUser32 = GetModuleHandleW(L"user32.dll");
    if (hUser32) {
        SetProcessDpiAwarenessContextFn setDpiContext =
            (SetProcessDpiAwarenessContextFn)GetProcAddress(hUser32, "SetProcessDpiAwarenessContext");
        if (setDpiContext) {
            setDpiContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
            return;
        }
    }
    // Fallback for older Windows builds
    SetProcessDPIAware();
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine, int nCmdShow) {
    UNREFERENCED_PARAMETER(hPrevInstance);
    UNREFERENCED_PARAMETER(pCmdLine);

    // Initialize DPI Awareness for crisp UI on high-resolution displays
    InitializeDpiAwareness();

    // Enforce Single-Instance application (FR-01, FR-02)
    HANDLE hMutex = CreateMutexW(NULL, TRUE, SINGLE_INSTANCE_MUTEX);
    if (hMutex && GetLastError() == ERROR_ALREADY_EXISTS) {
        // App is already running; find and focus existing window
        HWND hExistingWnd = FindWindowW(WINDOW_CLASS_NAME, WINDOW_TITLE);
        if (hExistingWnd) {
            PostMessageW(hExistingWnd, WM_APP_RESTORE_INSTANCE, 0, 0);
        }
        CloseHandle(hMutex);
        return 0;
    }

    // Initialize COM for WebView2
    HRESULT hrCom = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);

    // Create main application window
    HWND hWnd = app_window_create(hInstance, nCmdShow);
    if (!hWnd) {
        if (hMutex) {
            ReleaseMutex(hMutex);
            CloseHandle(hMutex);
        }
        if (SUCCEEDED(hrCom)) CoUninitialize();
        return 1;
    }

    // Standard Win32 Message Loop
    MSG msg = { 0 };
    while (GetMessageW(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    // Cleanup resources
    if (hMutex) {
        ReleaseMutex(hMutex);
        CloseHandle(hMutex);
    }

    if (SUCCEEDED(hrCom)) {
        CoUninitialize();
    }

    return (int)msg.wParam;
}
