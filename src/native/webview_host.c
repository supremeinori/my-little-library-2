/**
 * webview_host.c — Microsoft WebView2 Native Win32 Host
 * Implements pure C COM callbacks for WebView2 Environment and Controller creation.
 */

#define COBJMACROS
#if defined(__clang__)
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunknown-pragmas"
#endif
#include <windows.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <stdio.h>
#include <stdlib.h>
#include "WebView2.h"
#include "webview_host.h"

typedef HRESULT (STDAPICALLTYPE *CreateCoreWebView2EnvironmentWithOptionsFn)(
    PCWSTR browserExecutableFolder,
    PCWSTR userDataFolder,
    ICoreWebView2EnvironmentOptions* environmentOptions,
    ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler* environment_created_handler
);

static ICoreWebView2Controller *g_controller = NULL;
static ICoreWebView2 *g_webview = NULL;
static HMODULE g_hLoader = NULL;

/* ─────────────────────────────────────────────────────────────
   COM Callback: Environment Creation Completed Handler
   ───────────────────────────────────────────────────────────── */

typedef struct EnvironmentCompletedHandler {
    ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler lpVtblContainer;
    ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandlerVtbl vtbl;
    LONG refCount;
    HWND hWnd;
} EnvironmentCompletedHandler;

typedef struct ControllerCompletedHandler {
    ICoreWebView2CreateCoreWebView2ControllerCompletedHandler lpVtblContainer;
    ICoreWebView2CreateCoreWebView2ControllerCompletedHandlerVtbl vtbl;
    LONG refCount;
    HWND hWnd;
} ControllerCompletedHandler;

/* Controller Handler forward declarations */
static HRESULT STDMETHODCALLTYPE Controller_QueryInterface(
    ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This,
    REFIID riid,
    void **ppvObject
);
static ULONG STDMETHODCALLTYPE Controller_AddRef(ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This);
static ULONG STDMETHODCALLTYPE Controller_Release(ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This);
static HRESULT STDMETHODCALLTYPE Controller_Invoke(
    ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This,
    HRESULT errorCode,
    ICoreWebView2Controller *createdController
);

static ControllerCompletedHandler* CreateControllerCompletedHandler(HWND hWnd) {
    ControllerCompletedHandler *handler = (ControllerCompletedHandler*)malloc(sizeof(ControllerCompletedHandler));
    if (!handler) return NULL;

    handler->vtbl.QueryInterface = Controller_QueryInterface;
    handler->vtbl.AddRef = Controller_AddRef;
    handler->vtbl.Release = Controller_Release;
    handler->vtbl.Invoke = Controller_Invoke;

    handler->lpVtblContainer.lpVtbl = &handler->vtbl;
    handler->refCount = 1;
    handler->hWnd = hWnd;

    return handler;
}

static HRESULT STDMETHODCALLTYPE Controller_QueryInterface(
    ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This,
    REFIID riid,
    void **ppvObject
) {
    if (!ppvObject) return E_POINTER;

    if (IsEqualIID(riid, &IID_IUnknown) ||
        IsEqualIID(riid, &IID_ICoreWebView2CreateCoreWebView2ControllerCompletedHandler)) {
        *ppvObject = This;
        This->lpVtbl->AddRef(This);
        return S_OK;
    }

    *ppvObject = NULL;
    return E_NOINTERFACE;
}

static ULONG STDMETHODCALLTYPE Controller_AddRef(ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This) {
    ControllerCompletedHandler *self = (ControllerCompletedHandler*)This;
    return InterlockedIncrement(&self->refCount);
}

static ULONG STDMETHODCALLTYPE Controller_Release(ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This) {
    ControllerCompletedHandler *self = (ControllerCompletedHandler*)This;
    ULONG count = InterlockedDecrement(&self->refCount);
    if (count == 0) {
        free(self);
    }
    return count;
}

static void LocateWebFolder(wchar_t *outPath, size_t maxLen) {
    wchar_t exePath[MAX_PATH];
    GetModuleFileNameW(NULL, exePath, MAX_PATH);
    PathRemoveFileSpecW(exePath);

    // 1. Check <exeDir>\web
    wchar_t candidate[MAX_PATH];
    swprintf(candidate, MAX_PATH, L"%ls\\web", exePath);
    if (PathFileExistsW(candidate)) {
        wcsncpy(outPath, candidate, maxLen - 1);
        outPath[maxLen - 1] = L'\0';
        return;
    }

    // 2. Check <exeDir>\..\..\src\web (development / build dir)
    swprintf(candidate, MAX_PATH, L"%ls\\..\\..\\src\\web", exePath);
    if (PathFileExistsW(candidate)) {
        GetFullPathNameW(candidate, (DWORD)maxLen, outPath, NULL);
        return;
    }

    // 3. Check current directory src\web
    if (PathFileExistsW(L"src\\web")) {
        GetFullPathNameW(L"src\\web", (DWORD)maxLen, outPath, NULL);
        return;
    }

    // Default fallback to candidate 1
    wcsncpy(outPath, candidate, maxLen - 1);
    outPath[maxLen - 1] = L'\0';
}

static HRESULT STDMETHODCALLTYPE Controller_Invoke(
    ICoreWebView2CreateCoreWebView2ControllerCompletedHandler *This,
    HRESULT errorCode,
    ICoreWebView2Controller *createdController
) {
    ControllerCompletedHandler *self = (ControllerCompletedHandler*)This;

    if (FAILED(errorCode) || !createdController) {
        MessageBoxW(
            self->hWnd,
            L"Failed to initialize WebView2 controller.\nPlease ensure Microsoft Edge WebView2 Runtime is installed.",
            L"My Little Library — Error",
            MB_ICONERROR | MB_OK
        );
        return S_OK;
    }

    g_controller = createdController;
    g_controller->lpVtbl->AddRef(g_controller);

    // Initial resize to match window client rectangle
    RECT bounds;
    GetClientRect(self->hWnd, &bounds);
    g_controller->lpVtbl->put_Bounds(g_controller, bounds);
    g_controller->lpVtbl->put_IsVisible(g_controller, TRUE);

    // Retrieve CoreWebView2
    HRESULT hr = g_controller->lpVtbl->get_CoreWebView2(g_controller, &g_webview);
    if (SUCCEEDED(hr) && g_webview) {
        // Configure settings
        ICoreWebView2Settings *settings = NULL;
        if (SUCCEEDED(g_webview->lpVtbl->get_Settings(g_webview, &settings)) && settings) {
            settings->lpVtbl->put_IsStatusBarEnabled(settings, FALSE);
            settings->lpVtbl->put_AreDefaultContextMenusEnabled(settings, TRUE);
            settings->lpVtbl->Release(settings);
        }

        // Map local web folder to virtual domain "app.assets"
        wchar_t webFolder[MAX_PATH];
        LocateWebFolder(webFolder, MAX_PATH);

        ICoreWebView2_3 *webview3 = NULL;
        HRESULT hr3 = g_webview->lpVtbl->QueryInterface(
            g_webview,
            &IID_ICoreWebView2_3,
            (void**)&webview3
        );

        if (SUCCEEDED(hr3) && webview3) {
            webview3->lpVtbl->SetVirtualHostNameToFolderMapping(
                webview3,
                L"app.assets",
                webFolder,
                COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_ALLOW
            );
            webview3->lpVtbl->Release(webview3);
            g_webview->lpVtbl->Navigate(g_webview, L"https://app.assets/index.html");
        } else {
            // Fallback to local file URI
            wchar_t fileUrl[MAX_PATH + 32];
            swprintf(fileUrl, MAX_PATH + 32, L"file:///%ls/index.html", webFolder);
            g_webview->lpVtbl->Navigate(g_webview, fileUrl);
        }
    }

    return S_OK;
}

/* ─────────────────────────────────────────────────────────────
   Environment Handler implementation
   ───────────────────────────────────────────────────────────── */

static HRESULT STDMETHODCALLTYPE Env_QueryInterface(
    ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler *This,
    REFIID riid,
    void **ppvObject
) {
    if (!ppvObject) return E_POINTER;

    if (IsEqualIID(riid, &IID_IUnknown) ||
        IsEqualIID(riid, &IID_ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler)) {
        *ppvObject = This;
        This->lpVtbl->AddRef(This);
        return S_OK;
    }

    *ppvObject = NULL;
    return E_NOINTERFACE;
}

static ULONG STDMETHODCALLTYPE Env_AddRef(ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler *This) {
    EnvironmentCompletedHandler *self = (EnvironmentCompletedHandler*)This;
    return InterlockedIncrement(&self->refCount);
}

static ULONG STDMETHODCALLTYPE Env_Release(ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler *This) {
    EnvironmentCompletedHandler *self = (EnvironmentCompletedHandler*)This;
    ULONG count = InterlockedDecrement(&self->refCount);
    if (count == 0) {
        free(self);
    }
    return count;
}

static HRESULT STDMETHODCALLTYPE Env_Invoke(
    ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler *This,
    HRESULT errorCode,
    ICoreWebView2Environment *createdEnvironment
) {
    EnvironmentCompletedHandler *self = (EnvironmentCompletedHandler*)This;

    if (FAILED(errorCode) || !createdEnvironment) {
        MessageBoxW(
            self->hWnd,
            L"Microsoft WebView2 Runtime was not detected or failed to initialize.\n\n"
            L"Please download and install the WebView2 Evergreen Bootstrapper from:\n"
            L"https://go.microsoft.com/fwlink/p/?LinkId=2124703",
            L"My Little Library — WebView2 Runtime Required",
            MB_ICONERROR | MB_OK
        );
        return S_OK;
    }

    ControllerCompletedHandler *controllerHandler = CreateControllerCompletedHandler(self->hWnd);
    if (controllerHandler) {
        createdEnvironment->lpVtbl->CreateCoreWebView2Controller(
            createdEnvironment,
            self->hWnd,
            (ICoreWebView2CreateCoreWebView2ControllerCompletedHandler*)controllerHandler
        );
        controllerHandler->lpVtblContainer.lpVtbl->Release(
            (ICoreWebView2CreateCoreWebView2ControllerCompletedHandler*)controllerHandler
        );
    }

    return S_OK;
}

static EnvironmentCompletedHandler* CreateEnvironmentCompletedHandler(HWND hWnd) {
    EnvironmentCompletedHandler *handler = (EnvironmentCompletedHandler*)malloc(sizeof(EnvironmentCompletedHandler));
    if (!handler) return NULL;

    handler->vtbl.QueryInterface = Env_QueryInterface;
    handler->vtbl.AddRef = Env_AddRef;
    handler->vtbl.Release = Env_Release;
    handler->vtbl.Invoke = Env_Invoke;

    handler->lpVtblContainer.lpVtbl = &handler->vtbl;
    handler->refCount = 1;
    handler->hWnd = hWnd;

    return handler;
}

/* ─────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────── */

BOOL webview_host_init(HWND hWnd) {
    // Attempt to load WebView2Loader.dll from exe folder or deps folder
    wchar_t exePath[MAX_PATH];
    GetModuleFileNameW(NULL, exePath, MAX_PATH);
    PathRemoveFileSpecW(exePath);

    wchar_t loaderPath[MAX_PATH];
    swprintf(loaderPath, MAX_PATH, L"%ls\\WebView2Loader.dll", exePath);

    g_hLoader = LoadLibraryW(loaderPath);
    if (!g_hLoader) {
        // Fallback to deps/webview2/x64/WebView2Loader.dll
        swprintf(loaderPath, MAX_PATH, L"%ls\\..\\..\\deps\\webview2\\x64\\WebView2Loader.dll", exePath);
        g_hLoader = LoadLibraryW(loaderPath);
    }
    if (!g_hLoader) {
        g_hLoader = LoadLibraryW(L"WebView2Loader.dll");
    }

    if (!g_hLoader) {
        MessageBoxW(
            hWnd,
            L"WebView2Loader.dll could not be loaded.\n"
            L"Please ensure WebView2Loader.dll is located in the application directory.",
            L"My Little Library — Error",
            MB_ICONERROR | MB_OK
        );
        return FALSE;
    }

    CreateCoreWebView2EnvironmentWithOptionsFn createEnvFn =
        (CreateCoreWebView2EnvironmentWithOptionsFn)GetProcAddress(
            g_hLoader,
            "CreateCoreWebView2EnvironmentWithOptions"
        );

    if (!createEnvFn) {
        MessageBoxW(
            hWnd,
            L"Entry point 'CreateCoreWebView2EnvironmentWithOptions' was not found in WebView2Loader.dll.",
            L"My Little Library — Error",
            MB_ICONERROR | MB_OK
        );
        return FALSE;
    }

    // Determine User Data Folder (%LOCALAPPDATA%\MyLittleLibrary\WebView2Data)
    wchar_t userDataFolder[MAX_PATH];
    wchar_t localAppData[MAX_PATH];
    if (GetEnvironmentVariableW(L"LOCALAPPDATA", localAppData, MAX_PATH) > 0) {
        swprintf(userDataFolder, MAX_PATH, L"%ls\\MyLittleLibrary\\WebView2Data", localAppData);
    } else {
        swprintf(userDataFolder, MAX_PATH, L"%ls\\WebView2Data", exePath);
    }

    EnvironmentCompletedHandler *envHandler = CreateEnvironmentCompletedHandler(hWnd);
    if (!envHandler) return FALSE;

    HRESULT hr = createEnvFn(
        NULL,
        userDataFolder,
        NULL,
        (ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler*)envHandler
    );

    envHandler->lpVtblContainer.lpVtbl->Release(
        (ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler*)envHandler
    );

    return SUCCEEDED(hr);
}

void webview_host_resize(HWND hWnd) {
    if (g_controller) {
        RECT bounds;
        GetClientRect(hWnd, &bounds);
        g_controller->lpVtbl->put_Bounds(g_controller, bounds);
    }
}

void webview_host_cleanup(void) {
    if (g_webview) {
        g_webview->lpVtbl->Release(g_webview);
        g_webview = NULL;
    }
    if (g_controller) {
        g_controller->lpVtbl->Close(g_controller);
        g_controller->lpVtbl->Release(g_controller);
        g_controller = NULL;
    }
    if (g_hLoader) {
        FreeLibrary(g_hLoader);
        g_hLoader = NULL;
    }
}
