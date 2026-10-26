; Instalador do Visão Química para Windows x64 (NSIS, por usuário, sem pedir administrador).
; Gerado por scripts/package-windows-installer.cjs, que define APP_DIR, OUTPUT_FILE,
; PRODUCT_VERSION, ICON_FILE e FILE_LIST (lista de arquivos para o desinstalador).
Unicode true

!include "MUI2.nsh"

!ifndef APP_DIR
  !error "APP_DIR é obrigatório"
!endif
!ifndef OUTPUT_FILE
  !error "OUTPUT_FILE é obrigatório"
!endif
!ifndef PRODUCT_VERSION
  !error "PRODUCT_VERSION é obrigatório"
!endif
!ifndef ICON_FILE
  !error "ICON_FILE é obrigatório"
!endif
!ifndef FILE_LIST
  !error "FILE_LIST é obrigatório"
!endif

!define PRODUCT_NAME "Visão Química"
!define EXE_NAME "Visao Quimica.exe"
!define REG_KEY "Software\VisaoQuimica"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\VisaoQuimica"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${OUTPUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\Visao Quimica"
InstallDirRegKey HKCU "${REG_KEY}" "InstallLocation"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 64

VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey /LANG=1046 "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey /LANG=1046 "FileDescription" "Instalador do ${PRODUCT_NAME}"
VIAddVersionKey /LANG=1046 "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey /LANG=1046 "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey /LANG=1046 "LegalCopyright" ""

!define MUI_ICON "${ICON_FILE}"
!define MUI_UNICON "${ICON_FILE}"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXE_NAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Abrir o ${PRODUCT_NAME}"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "PortugueseBR"

Section "Instalar" InstallSection
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  File /r "${APP_DIR}\*"

  WriteUninstaller "$INSTDIR\Desinstalar.exe"
  CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}.lnk" "$INSTDIR\${EXE_NAME}"
  CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${EXE_NAME}"

  WriteRegStr HKCU "${REG_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\${EXE_NAME}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" "$\"$INSTDIR\Desinstalar.exe$\""
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoRepair" 1
SectionEnd

; O desinstalador apaga só os arquivos que o instalador colocou (lista gerada no build) e as
; pastas que ficarem vazias: nunca apaga a pasta escolhida inteira, que pode ter outros arquivos.
Section "Uninstall"
  SetShellVarContext current
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}.lnk"
  !include "${FILE_LIST}"
  Delete "$INSTDIR\Desinstalar.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "${UNINSTALL_KEY}"
  DeleteRegKey HKCU "${REG_KEY}"
SectionEnd
