#include <node_api.h>
#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// --- Helper: Get Last Error as String ---
void GetLastErrorStr(char* buffer, size_t size) {
    DWORD errorMessageID = GetLastError();
    if (errorMessageID == 0) {
        buffer[0] = '\0';
        return;
    }
    FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
                   NULL, errorMessageID, MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), buffer, (DWORD)size, NULL);
}

// --- Native Read File ---
napi_value ReadFileNative(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    char filePath[MAX_PATH];
    napi_get_value_string_utf8(env, args[0], filePath, MAX_PATH, NULL);

    FILE* file = fopen(filePath, "rb");
    if (!file) {
        napi_throw_error(env, NULL, "Could not open file natively");
        return NULL;
    }

    fseek(file, 0, SEEK_END);
    long length = ftell(file);
    fseek(file, 0, SEEK_SET);

    napi_value result;
    void* bufferData;
    napi_create_buffer(env, length, &bufferData, &result);
    
    if (length > 0) {
        fread(bufferData, 1, length, file);
    }
    fclose(file);

    return result;
}
// --- Native Write File ---
napi_value WriteFileNative(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    char filePath[MAX_PATH];
    napi_get_value_string_utf8(env, args[0], filePath, MAX_PATH, NULL);
    void* data;
    size_t length;
    bool isBuffer;
    napi_is_buffer(env, args[1], &isBuffer);
    if (isBuffer) {
        napi_get_buffer_info(env, args[1], &data, &length);
    } else {
        // Fallback or handle string
        napi_get_value_string_utf8(env, args[1], NULL, 0, &length);
        data = malloc(length + 1);
        napi_get_value_string_utf8(env, args[1], (char*)data, length + 1, NULL);
    }
    FILE* file = fopen(filePath, "wb");
    if (!file) {
        if (!isBuffer) free(data);
        napi_throw_error(env, NULL, "Failed to open file for writing natively");
        return NULL;
    }
    fwrite(data, 1, length, file);
    fclose(file);
    if (!isBuffer) free(data);
    napi_value result;
    napi_create_string_utf8(env, "Success", NAPI_AUTO_LENGTH, &result);
    return result;
}

// --- Native Delete File ---
napi_value DeleteFileNative(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    char filePath[MAX_PATH];
    napi_get_value_string_utf8(env, args[0], filePath, MAX_PATH, NULL);

    if (!DeleteFileA(filePath)) {
        char errorBuf[256];
        GetLastErrorStr(errorBuf, sizeof(errorBuf));
        napi_throw_error(env, NULL, errorBuf);
        return NULL;
    }
    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}
// --- Native Rename File ---
napi_value RenameFileNative(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    char oldPath[MAX_PATH];
    char newPath[MAX_PATH];
    napi_get_value_string_utf8(env, args[0], oldPath, MAX_PATH, NULL);
    napi_get_value_string_utf8(env, args[1], newPath, MAX_PATH, NULL);
    if (!MoveFileA(oldPath, newPath)) {
        char errorBuf[256];
        GetLastErrorStr(errorBuf, sizeof(errorBuf));
        napi_throw_error(env, NULL, errorBuf);
        return NULL;
    }
    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}
// --- Native Create Dir ---
napi_value CreateDirNative(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    char dirPath[MAX_PATH];
    napi_get_value_string_utf8(env, args[0], dirPath, MAX_PATH, NULL);
    if (!CreateDirectoryA(dirPath, NULL) && GetLastError() != ERROR_ALREADY_EXISTS) {
        char errorBuf[256];
        GetLastErrorStr(errorBuf, sizeof(errorBuf));
        napi_throw_error(env, NULL, errorBuf);
        return NULL;
    }
    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}
// --- Native Delete Dir ---
napi_value DeleteDirNative(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    char dirPath[MAX_PATH];
    napi_get_value_string_utf8(env, args[0], dirPath, MAX_PATH, NULL);
    if (!RemoveDirectoryA(dirPath)) {
        char errorBuf[256];
        GetLastErrorStr(errorBuf, sizeof(errorBuf));
        napi_throw_error(env, NULL, errorBuf);
        return NULL;
    }
    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}
// --- Native List Dir ---
napi_value ListDirNative(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    char dirPath[MAX_PATH];
    napi_get_value_string_utf8(env, args[0], dirPath, MAX_PATH, NULL);
    strcat(dirPath, "\\*");
    WIN32_FIND_DATAA findData;
    HANDLE hFind = FindFirstFileA(dirPath, &findData);
    napi_value result;
    napi_create_array(env, &result);
    if (hFind != INVALID_HANDLE_VALUE) {
        uint32_t i = 0;
        do {
            if (strcmp(findData.cFileName, ".") != 0 && strcmp(findData.cFileName, "..") != 0) {
                napi_value fileName;
                napi_create_string_utf8(env, findData.cFileName, NAPI_AUTO_LENGTH, &fileName);
                napi_set_element(env, result, i++, fileName);
            }
        } while (FindNextFileA(hFind, &findData));
        FindClose(hFind);
    }
    return result;
}
// --- Native Create Process ---
napi_value CreateProcessNative(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    char command[1024];
    napi_get_value_string_utf8(env, args[0], command, 1024, NULL);
    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));
    if (!CreateProcessA(NULL, command, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
        char errorBuf[256];
        GetLastErrorStr(errorBuf, sizeof(errorBuf));
        napi_throw_error(env, NULL, errorBuf);
        return NULL;
    }
    napi_value pid;
    napi_create_uint32(env, (uint32_t)pi.dwProcessId, &pid);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return pid;
}
// --- Native Kill Process ---
napi_value KillProcessNative(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    uint32_t pid;
    napi_get_value_uint32(env, args[0], &pid);
    HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, pid);
    if (hProcess == NULL) {
        char errorBuf[256];
        GetLastErrorStr(errorBuf, sizeof(errorBuf));
        napi_throw_error(env, NULL, errorBuf);
        return NULL;
    }
    if (!TerminateProcess(hProcess, 0)) {
        char errorBuf[256];
        GetLastErrorStr(errorBuf, sizeof(errorBuf));
        CloseHandle(hProcess);
        napi_throw_error(env, NULL, errorBuf);
        return NULL;
    }
    CloseHandle(hProcess);
    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}
// --- Native Process List ---
napi_value ProcessListNative(napi_env env, napi_callback_info info) {
    HANDLE hProcessSnap;
    PROCESSENTRY32 pe32;
    hProcessSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hProcessSnap == INVALID_HANDLE_VALUE) {
        napi_throw_error(env, NULL, "Failed to create process snapshot");
        return NULL;
    }
    pe32.dwSize = sizeof(PROCESSENTRY32);
    if (!Process32First(hProcessSnap, &pe32)) {
        CloseHandle(hProcessSnap);
        napi_throw_error(env, NULL, "Failed to get first process");
        return NULL;
    }
    napi_value result;
    napi_create_array(env, &result);
    uint32_t i = 0;
    do {
        char processInfo[MAX_PATH + 24];
        sprintf(processInfo, "[%d] %s", pe32.th32ProcessID, pe32.szExeFile);
        
        napi_value processStr;
        napi_create_string_utf8(env, processInfo, NAPI_AUTO_LENGTH, &processStr);
        napi_set_element(env, result, i++, processStr);
    } while (Process32Next(hProcessSnap, &pe32));

    CloseHandle(hProcessSnap);
    return result;
}
// --- Initialization ---
napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "readFile", NULL, ReadFileNative, NULL, NULL, NULL, napi_default, NULL },
        { "writeFile", NULL, WriteFileNative, NULL, NULL, NULL, napi_default, NULL },
        { "deleteFile", NULL, DeleteFileNative, NULL, NULL, NULL, napi_default, NULL },
        { "renameFile", NULL, RenameFileNative, NULL, NULL, NULL, napi_default, NULL },
        { "createDir", NULL, CreateDirNative, NULL, NULL, NULL, napi_default, NULL },
        { "deleteDir", NULL, DeleteDirNative, NULL, NULL, NULL, napi_default, NULL },
        { "listDir", NULL, ListDirNative, NULL, NULL, NULL, napi_default, NULL },
        { "processList", NULL, ProcessListNative, NULL, NULL, NULL, napi_default, NULL },
        { "createProcess", NULL, CreateProcessNative, NULL, NULL, NULL, napi_default, NULL },
        { "killProcess", NULL, KillProcessNative, NULL, NULL, NULL, napi_default, NULL }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}
NAPI_MODULE(syscalls, Init);



