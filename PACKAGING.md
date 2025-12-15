# 打包与编译指南（Windows EXE）

## 环境准备
- 系统：Windows 10/11 x64
- 工具：Node.js 18+（含 npm）
- 依赖：项目已内置 `electron-builder`、`typescript`

## 开发运行
```bash
# 安装依赖
npm install

# 编译TypeScript
npm run build

# 启动调试
npm start
```

**说明**：首次运行会在用户目录 `%AppData%/ElectronicPet` 创建 `save.json`，全部数据仅本地存储。

## 打包 EXE

### 安装包（NSIS）
```bash
# 标准打包（已优化压缩速度）
npm run dist:win

# 极速打包（无压缩，测试用）
npm run dist:win:fast
```
- 产物目录：`dist_electron/`
- 包含 `Setup.exe`（安装向导）
- `dist:win` 使用 normal 压缩，兼顾速度与体积
- `dist:win:fast` 使用 store 存储，速度最快但体积大

### 快速测试（文件夹）
```bash
npm run dist:dir
```
- 产物目录：`dist_electron/win-unpacked/`
- 不生成安装包，直接解压到文件夹
- **最快**的测试方式，秒级完成

### 便携版（Portable）
```bash
npm run dist:portable
```
- 产物目录：`dist_electron/`
- 包含 `ElectronicPet.exe`（绿色版）
- 数据写入用户目录
- 无需安装，直接运行

### 打包所有变体
```bash
npm run dist:all
```

## 使用国内镜像（推荐）

项目根目录已配置 `.npmrc`：
```
registry=https://registry.npmmirror.com
```

**加速 Electron 二进制下载**（PowerShell）：
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install
```

## 打包内容

打包文件包含：
- `dist/**/*` - 编译后的主进程与预加载
- `src/renderer/**/*` - 渲染端 HTML/JS
- `assets/**/*` - 资源目录（精灵图、音效、托盘图标）

**输出目录**：`dist_electron/`

## 可选配置

### 应用图标
在 `assets/` 提供 `icon.ico`，并在 `package.json` 的 `build.win.icon` 指定路径。

### 代码签名（可选）
如需减少安全警告，请配置证书并在 `electron-builder` 中启用签名。

## 常见问题

### 打包失败
1. 检查 Node.js 版本是否 18+
2. 清理后重试：
   ```bash
   rm -rf dist dist_electron node_modules
   npm install
   npm run build
   npm run dist:win
   ```

### 启动报“已被阻止”
- Windows Defender 误报：选择“仍要运行”
- 此项目完全离线，不含网络更新
- 建议使用代码签名避免警告

### 资源未显示
确保资源放在 `assets/` 并被 `package.json` 的 `build.files` 包含。

## 项目路径

项目根：`d:\work\local\Electronic_pet`

**常用命令**：
```bash
npm install              # 安装依赖
npm run build           # 编译TypeScript
npm start               # 启动开发模式
npm run dist:win        # 打包安装包
npm run dist:portable   # 打包便携版
```
